import { Data, Effect, Option, Predicate, Schema, Stream } from 'effect'

import {
  createRunId,
  DefinitionCatalogSchema,
  EventEnvelopeSchema,
  readSubscriptionData,
  ReplayStepSchema,
  RunStateSchema,
  RunSummariesSchema,
  SecretContextSchema,
  stringifyJson,
  traceHeaders,
  type DefinitionInput,
  type DefinitionRef,
  type EventEnvelope,
  type EventInput,
  type JsonValue,
  type RunAttributes,
  type RunState,
  type SecretContext,
  type SubscriptionTransport,
  type TraceContext,
  type WorkerCallback,
  type WorkerCallbackInput,
  type WorkerCallbackResult,
  type WorkerSecretsResult,
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

interface WorkerFailRequestBody {
  error: string
  nonRetryable?: boolean
  retryAfterMs?: number
}

function attemptPath(runId: string, attempt: WorkerCallback): string {
  return `/runs/${encodeURIComponent(runId)}/effects/${encodeURIComponent(attempt.effectId)}/${attempt.attempt}`
}

function workerCallbackBody(input: WorkerCallbackInput) {
  switch (input.kind) {
    case 'complete':
      return { events: input.events }

    case 'fail': {
      const body: WorkerFailRequestBody = { error: input.error }

      if (input.nonRetryable !== undefined) {
        body.nonRetryable = input.nonRetryable
      }

      if (input.retryAfterMs !== undefined) {
        body.retryAfterMs = input.retryAfterMs
      }

      return body
    }

    case 'heartbeat':
      return input.details === undefined ? {} : { details: input.details }
    case 'started':
    case 'cancelled':
      return {}

    default: {
      const exhaustive: never = input
      return exhaustive
    }
  }
}

const WorkerCallbackResultSchema = Schema.Struct({
  status: Schema.Union([
    Schema.Literal('accepted'),
    Schema.Literal('stale'),
    Schema.Literal('cancelled'),
  ]),
  cancelRequested: Schema.Boolean,
})

const WorkerSecretsResultSchema = Schema.Union([
  Schema.Struct({ status: Schema.Literal('accepted'), secrets: SecretContextSchema }),
  Schema.Struct({ status: Schema.Union([Schema.Literal('stale'), Schema.Literal('cancelled')]) }),
])

/** `appended` counts the events the run gained while the wake ran. */
const WakeResultSchema = Schema.Struct({
  runId: Schema.String,
  state: RunStateSchema,
  appended: Schema.Finite,
})

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
  /**
   * Appended as `grant` to the event-stream URL, for both SSE and WebSocket subscriptions. A read
   * grant cannot authorize other requests, so it is not sent on them.
   */
  grant?: string
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
    third: number | SubscribeEventsOptions = 1_000,
  ) => {
    const settings = subscriptionSettings(third, options.grant)
    let fromSeq = 1
    const controller = new AbortController()

    const run = Effect.gen(function* () {
      while (!controller.signal.aborted) {
        yield* Effect.gen(function* () {
          if (useWebSocket(settings)) {
            return yield* consumeWebSocket({
              baseUrl,
              runId,
              settings,
              signal: controller.signal,
              currentSeq: () => fromSeq,
              setSeq: (next) => {
                fromSeq = next
              },
              onEvent,
            })
          }

          const cursor = Math.max(0, fromSeq - 1)
          const headers = new Headers({ accept: 'text/event-stream' })

          if (cursor > 0) {
            headers.set('last-event-id', String(cursor))
          }

          const res = yield* Effect.tryPromise({
            try: (signal) =>
              fetchImpl(`${baseUrl}${eventsQuery(runId, fromSeq, settings)}`, {
                headers,
                signal,
              }),
            catch: (cause) => new LoomsClientError('Event subscription failed', cause),
          })

          const body = res.body

          if (res.ok && body) {
            return yield* consumeSseStreamEffect(body, (frame) => {
              let resync = false

              deliverSubscriptionData({
                data: frame.data,
                runId,
                currentSeq: () => fromSeq,
                setSeq: (next) => {
                  fromSeq = next
                },
                onEvent,
                onResync: () => {
                  resync = true
                },
              })

              return resync ? false : undefined
            })
          }

          return yield* new LoomsClientError(
            res.ok ? 'event stream missing body' : `HTTP ${res.status}`,
          )
        }).pipe(Effect.ignore)

        if (controller.signal.aborted) {
          break
        }

        yield* Effect.sleep(settings.reconnectDelayMs)
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
    attributes?: RunAttributes
    secrets?: SecretContext
    /** Sent as the W3C `traceparent` and `tracestate` headers. */
    trace?: TraceContext
  }) => {
    const { trace, ...body } = args

    return request('/runs', StartResultSchema, {
      method: 'POST',
      headers: traceHeaders(trace),
      body: stringifyJson(body),
    })
  }

  const workerHeaders = options.workerCallbackToken
    ? { authorization: `Bearer ${options.workerCallbackToken}` }
    : undefined

  const workerCallback = (
    runId: string,
    input: WorkerCallbackInput,
  ): Promise<WorkerCallbackResult> => {
    const body = workerCallbackBody(input)

    return request(`${attemptPath(runId, input)}/${input.kind}`, WorkerCallbackResultSchema, {
      method: 'POST',
      headers: workerHeaders,
      body: stringifyJson(body),
    })
  }

  /** Read the run's secret context. Only the attempt that is currently running gets it. */
  const workerSecrets = (runId: string, attempt: WorkerCallback): Promise<WorkerSecretsResult> =>
    request(`${attemptPath(runId, attempt)}/secrets`, WorkerSecretsResultSchema, {
      method: 'POST',
      headers: workerHeaders,
      body: '{}',
    })

  const streamRun = (args: {
    kind: string
    definitionName: string
    definitionVersion?: string
    input?: JsonValue
    runId?: string
    trace?: TraceContext
  }): StreamHandle => {
    const { trace, ...body } = args
    const runId = body.runId ?? createRunId()

    const stream = Stream.unwrap(
      Effect.tryPromise({
        try: (signal) =>
          fetchImpl(`${baseUrl}/runs`, {
            method: 'POST',
            headers: {
              ...traceHeaders(trace),
              'content-type': 'application/json',
              accept: 'text/event-stream',
            },
            body: stringifyJson({ ...body, runId }),
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
      request(`/runs/${encodeURIComponent(runId)}/wake`, WakeResultSchema, { method: 'POST' }),
    /** Cancel a thread and its descendants; omit `threadId` to cancel the whole run. */
    cancel: (runId: string, threadId?: string) =>
      request(`/runs/${encodeURIComponent(runId)}/cancel`, RunResultSchema, {
        method: 'POST',
        body: stringifyJson(threadId === undefined ? {} : { threadId }),
      }),
    /** Start a new run that continues where a finished run ended. */
    fork: (sourceRunId: string, forkOptions?: { runId?: string }) =>
      request(`/runs/${encodeURIComponent(sourceRunId)}/fork`, StartResultSchema, {
        method: 'POST',
        body: stringifyJson(forkOptions?.runId === undefined ? {} : { runId: forkOptions.runId }),
      }),
    workerCallback,
    workerSecrets,
    listRunSummaries: () => request('/runs/summaries', RunSummariesSchema),
    listDefinitions: () => request('/definitions', DefinitionCatalogSchema),
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

export interface SubscribeEventsOptions {
  readonly transport?: SubscriptionTransport
  readonly reconnectDelayMs?: number
  readonly threadId?: string
  readonly includeEphemeral?: boolean
  readonly webSocket?: SubscriptionSocketConstructor
}

export interface SubscriptionSocket {
  addEventListener(type: string, listener: (event: { readonly data?: unknown }) => void): void
  close(code?: number, reason?: string): void
}

export interface SubscriptionSocketConstructor {
  new (url: string): SubscriptionSocket
}

interface SubscriptionDelivery {
  readonly data: string
  readonly runId: string
  readonly currentSeq: () => number
  readonly setSeq: (seq: number) => void
  readonly onEvent: (event: EventEnvelope) => void
  readonly onResync: () => void
}

interface WebSocketSubscription {
  readonly baseUrl: string
  readonly runId: string
  readonly settings: ResolvedSubscription
  readonly signal: AbortSignal
  readonly currentSeq: () => number
  readonly setSeq: (seq: number) => void
  readonly onEvent: (event: EventEnvelope) => void
}

interface ResolvedSubscription extends SubscribeEventsOptions {
  readonly transport: SubscriptionTransport
  readonly reconnectDelayMs: number
  readonly grant?: string
}

function subscriptionSettings(
  third: number | SubscribeEventsOptions,
  grant: string | undefined,
): ResolvedSubscription {
  if (Predicate.isNumber(third)) {
    return { transport: 'sse', reconnectDelayMs: third, grant }
  }

  return {
    transport: third.transport ?? 'sse',
    reconnectDelayMs: third.reconnectDelayMs ?? 1_000,
    threadId: third.threadId,
    includeEphemeral: third.includeEphemeral,
    webSocket: third.webSocket,
    grant,
  }
}

function useWebSocket(settings: ResolvedSubscription): boolean {
  if (settings.transport !== 'websocket' && settings.transport !== 'auto') {
    return false
  }

  return settings.webSocket !== undefined || globalWebSocket() !== undefined
}

function eventsQuery(runId: string, fromSeq: number, settings: ResolvedSubscription): string {
  const params = new URLSearchParams({ fromSeq: String(fromSeq) })

  if (settings.threadId) {
    params.set('threadId', settings.threadId)
  }

  if (settings.includeEphemeral === false) {
    params.set('includeEphemeral', 'false')
  }

  if (settings.grant) {
    params.set('grant', settings.grant)
  }

  return `/runs/${encodeURIComponent(runId)}/events?${params.toString()}`
}

/** Resolve a possibly-relative HTTP base so `new URL(path, base)` never throws on `''` or `/app`. */
export function absoluteHttpBase(baseUrl: string): string {
  try {
    return new URL(baseUrl).toString()
  } catch {
    const page =
      typeof globalThis.location !== 'undefined' && Predicate.isString(globalThis.location.href)
        ? globalThis.location.href
        : 'http://localhost/'

    return new URL(baseUrl === '' ? '.' : baseUrl, page).toString()
  }
}

function webSocketUrl(baseUrl: string, path: string): string {
  const url = new URL(path, absoluteHttpBase(baseUrl))
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function globalWebSocket(): SubscriptionSocketConstructor | undefined {
  if (!('WebSocket' in globalThis) || !Predicate.isFunction(globalThis.WebSocket)) {
    return undefined
  }

  return globalThis.WebSocket
}

function consumeWebSocket(
  subscription: WebSocketSubscription,
): Effect.Effect<void, LoomsClientError> {
  const Socket = subscription.settings.webSocket ?? globalWebSocket()

  if (!Socket) {
    return Effect.void
  }

  const url = webSocketUrl(
    subscription.baseUrl,
    eventsQuery(subscription.runId, subscription.currentSeq(), subscription.settings),
  )

  return Effect.callback((resume) => {
    const socket = new Socket(url)

    const finish = () => {
      resume(Effect.void)
    }

    if (subscription.signal.aborted) {
      socket.close()
      finish()
      return Effect.void
    }

    const onAbort = () => {
      socket.close()
      finish()
    }

    subscription.signal.addEventListener('abort', onAbort)

    socket.addEventListener('message', (event) => {
      if (!Predicate.isString(event.data)) {
        return
      }

      deliverSubscriptionData({
        data: event.data,
        runId: subscription.runId,
        currentSeq: subscription.currentSeq,
        setSeq: subscription.setSeq,
        onEvent: subscription.onEvent,
        onResync: () => {
          socket.close()
        },
      })
    })

    socket.addEventListener('close', finish)
    socket.addEventListener('error', finish)

    return Effect.sync(() => {
      subscription.signal.removeEventListener('abort', onAbort)
      socket.close()
    })
  })
}

function deliverSubscriptionData(delivery: SubscriptionDelivery): void {
  const read = readSubscriptionData(delivery.data, delivery.runId)

  switch (read.kind) {
    case 'events': {
      const fromSeq = delivery.currentSeq()
      let next = fromSeq

      for (const event of read.events) {
        if (event.seq < fromSeq) {
          continue
        }

        delivery.onEvent(event)
        next = Math.max(next, event.seq + 1)
      }

      delivery.setSeq(next)
      return
    }

    case 'resync':
      delivery.setSeq(read.head)
      delivery.onResync()
      return

    case 'hello':
    case 'ignore':
      return

    default: {
      const unexpected: never = read
      return unexpected
    }
  }
}
