import { Data, Effect, Option, Schema, Stream } from 'effect'

import {
  createRunId,
  EventEnvelopeSchema,
  ReplayStepSchema,
  RunStateSchema,
  stringifyJson,
  type DefinitionInput,
  type DefinitionRef,
  type EventEnvelope,
  type EventInput,
  type JsonValue,
  type RunState,
} from '@looms/core'

import { consumeSseStreamEffect, eventsFromSseData, sseFrames } from './sse'

class LoomsClientError extends Data.TaggedError('LoomsClientError')<{
  readonly cause?: unknown
  readonly message: string
}> {
  constructor(message: string, cause?: unknown) {
    super({ cause, message })
    this.name = 'LoomsClientError'
  }
}

const decodeStreamError = Schema.decodeUnknownOption(
  Schema.fromJsonString(Schema.Struct({ error: Schema.String })),
)

const StartResultSchema = Schema.Struct({
  runId: Schema.String,
  threadId: Schema.String,
  state: RunStateSchema,
})

const RunResultSchema = Schema.Struct({ runId: Schema.String, state: RunStateSchema })

const EventsResultSchema = Schema.Struct({
  runId: Schema.String,
  events: Schema.Array(EventEnvelopeSchema),
})

const ReplayResultSchema = Schema.Struct({
  runId: Schema.String,
  step: Schema.NullOr(ReplayStepSchema),
})

const ProjectionResultSchema = Schema.Struct({
  runId: Schema.String,
  name: Schema.String,
  value: Schema.Unknown,
})

export interface LoomsClientOptions {
  baseUrl?: string
  fetch?: typeof fetch
  workerCallbackToken?: string
}

export interface StartResult {
  runId: string
  threadId: string
  state: RunState
}

export interface StreamHandle extends AsyncIterable<EventEnvelope> {
  readonly runId: string
}

export function createLoomsClient(options: LoomsClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
  const fetchImpl = options.fetch ?? fetch

  function request<T>(
    path: string,
    schema: Schema.ConstraintDecoder<T>,
    init?: RequestInit,
  ): Promise<T> {
    const headers = new Headers(init?.headers)

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    return Effect.runPromise(
      Effect.gen(function* () {
        const res = yield* Effect.tryPromise({
          try: (signal) => fetchImpl(`${baseUrl}${path}`, { ...init, headers, signal }),
          catch: (cause) => new LoomsClientError('Request failed', cause),
        })

        if (!res.ok) {
          const body = yield* Effect.promise(() => res.text())
          return yield* new LoomsClientError(body || `HTTP ${res.status}`)
        }

        const body = yield* Effect.promise(() => res.json())
        return yield* Schema.decodeUnknownEffect(schema)(body).pipe(
          Effect.mapError((cause) => new LoomsClientError('Invalid response body', cause)),
        )
      }),
    )
  }

  const subscribeEvents = (
    runId: string,
    onEvent: (event: EventEnvelope) => void,
    reconnectDelayMs = 1_000,
  ) => {
    let fromSeq = 1
    const controller = new AbortController()

    const run = Effect.gen(function* () {
      while (!controller.signal.aborted) {
        yield* Effect.gen(function* () {
          const cursor = Math.max(0, fromSeq - 1)
          const headers = new Headers({ accept: 'text/event-stream' })

          if (cursor > 0) {
            headers.set('last-event-id', String(cursor))
          }

          const res = yield* Effect.tryPromise({
            try: (signal) =>
              fetchImpl(`${baseUrl}/runs/${encodeURIComponent(runId)}/events?fromSeq=${fromSeq}`, {
                headers,
                signal,
              }),
            catch: (cause) => new LoomsClientError('Event subscription failed', cause),
          })

          const body = res.body

          if (res.ok && body) {
            return yield* consumeSseStreamEffect(body, (frame) => {
              for (const event of eventsFromSseData(frame.data, runId)) {
                onEvent(event)
                fromSeq = Math.max(fromSeq, event.seq + 1)
              }
            })
          }

          return yield* new LoomsClientError(
            res.ok ? 'event stream missing body' : `HTTP ${res.status}`,
          )
        }).pipe(Effect.ignore)

        if (controller.signal.aborted) {
          break
        }

        yield* Effect.sleep(reconnectDelayMs)
      }
    })

    void Effect.runPromise(run, { signal: controller.signal }).catch(() => undefined)

    return () => {
      controller.abort()
    }
  }

  const startRun = (args: {
    kind: string
    definitionName: string
    definitionVersion?: string
    input?: JsonValue
    runId?: string
  }) => request('/runs', StartResultSchema, { method: 'POST', body: stringifyJson(args) })

  const workerCallback = (
    runId: string,
    effectId: string,
    attempt: number,
    action: 'started' | 'heartbeat' | 'complete' | 'fail' | 'cancelled',
    body: JsonValue = {},
  ) =>
    request(
      `/runs/${encodeURIComponent(runId)}/effects/${encodeURIComponent(effectId)}/${attempt}/${action}`,
      RunResultSchema,
      {
        method: 'POST',
        headers: options.workerCallbackToken
          ? { authorization: `Bearer ${options.workerCallbackToken}` }
          : undefined,
        body: stringifyJson(body),
      },
    )

  const streamRun = (args: {
    kind: string
    definitionName: string
    definitionVersion?: string
    input?: JsonValue
    runId?: string
  }): StreamHandle => {
    const runId = args.runId ?? createRunId()

    const stream = Stream.unwrap(
      Effect.tryPromise({
        try: (signal) =>
          fetchImpl(`${baseUrl}/runs`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              accept: 'text/event-stream',
            },
            body: stringifyJson({ ...args, runId }),
            signal,
          }),
        catch: (cause) => new LoomsClientError('Failed to start event stream', cause),
      }).pipe(
        Effect.flatMap((res) =>
          res.ok && res.body
            ? Effect.succeed(sseFrames(res.body))
            : new LoomsClientError(res.ok ? 'SSE stream missing body' : `HTTP ${res.status}`),
        ),
      ),
    ).pipe(
      Stream.takeWhile((frame) => frame.event !== 'done'),
      Stream.mapEffect((frame) => {
        if (frame.event !== 'error') {
          return Effect.succeed(eventsFromSseData(frame.data, runId))
        }

        const decoded = decodeStreamError(frame.data)
        return new LoomsClientError(Option.isSome(decoded) ? decoded.value.error : frame.data)
      }),
      Stream.flatMap(Stream.fromIterable),
    )

    return Object.assign(Stream.toAsyncIterable(stream), { runId })
  }

  return {
    /** Start a run by `{ kind, definitionName }` when you only have names. */
    startRun,
    /** Start a run from a definition object (agent, workflow, or your own kind). */
    start: <TDef extends DefinitionRef>(definition: TDef, input?: DefinitionInput<TDef>) =>
      request('/runs', StartResultSchema, {
        method: 'POST',
        body: stringifyJson({
          kind: definition.kind,
          definitionName: definition.name,
          definitionVersion: definition.version,
          input,
        }),
      }),
    getRun: (runId: string) => request(`/runs/${encodeURIComponent(runId)}`, RunResultSchema),
    getState: (runId: string) => request(`/runs/${encodeURIComponent(runId)}`, RunResultSchema),
    getEvents: (runId: string, opts?: { fromSeq?: number; limit?: number }) => {
      const params = new URLSearchParams()

      if (opts?.fromSeq !== undefined) {
        params.set('fromSeq', String(opts.fromSeq))
      }

      if (opts?.limit !== undefined) {
        params.set('limit', String(opts.limit))
      }

      const q = params.toString()
      return request(
        `/runs/${encodeURIComponent(runId)}/events${q ? `?${q}` : ''}`,
        EventsResultSchema,
      )
    },
    signal: (runId: string, events: ReadonlyArray<EventInput>) =>
      request(`/runs/${encodeURIComponent(runId)}/events`, RunResultSchema, {
        method: 'POST',
        body: stringifyJson({ events }),
      }),
    wake: (runId: string) =>
      request(`/runs/${encodeURIComponent(runId)}/wake`, RunResultSchema, { method: 'POST' }),
    workerStarted: (runId: string, effectId: string, attempt: number) =>
      workerCallback(runId, effectId, attempt, 'started'),
    workerHeartbeat: (runId: string, effectId: string, attempt: number) =>
      workerCallback(runId, effectId, attempt, 'heartbeat'),
    workerComplete: (
      runId: string,
      effectId: string,
      attempt: number,
      events: ReadonlyArray<EventInput>,
    ) => workerCallback(runId, effectId, attempt, 'complete', { events }),
    workerFail: (runId: string, effectId: string, attempt: number, error: string) =>
      workerCallback(runId, effectId, attempt, 'fail', { error }),
    workerCancelled: (runId: string, effectId: string, attempt: number) =>
      workerCallback(runId, effectId, attempt, 'cancelled'),
    replayTo: (runId: string, seq: number) =>
      request(`/runs/${encodeURIComponent(runId)}/replay?seq=${seq}`, ReplayResultSchema),
    project: (runId: string, name: string) =>
      request(
        `/runs/${encodeURIComponent(runId)}/projections/${encodeURIComponent(name)}`,
        ProjectionResultSchema,
      ),
    subscribeEvents,
    /**
     * Subscribe to the run log, then start execution so deltas arrive live.
     * Yields events in store order, including live module events such as `agent.turn.text_delta`.
     */
    streamRun,
    stream: <TDef extends DefinitionRef>(
      definition: TDef,
      input?: DefinitionInput<TDef>,
    ): StreamHandle =>
      streamRun({
        kind: definition.kind,
        definitionName: definition.name,
        definitionVersion: definition.version,
        input,
      }),
  }
}

export type LoomsClient = ReturnType<typeof createLoomsClient>
