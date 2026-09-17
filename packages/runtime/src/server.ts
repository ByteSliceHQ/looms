import { Data, Effect, Schema } from 'effect'

import {
  createRunId,
  EventStoreTag,
  InvalidEventError,
  InvalidInputError,
  JsonValueSchema,
  stringifyJson,
  type EventStore,
  type JsonValue,
} from '@looms/core'

import type { LoomsRuntime } from './runtime'
import { createEventStreamResponse } from './sse'

export interface FetchHandlerOptions {
  runtime: LoomsRuntime
  store: EventStore
}

export interface RunningServer {
  port: number
  stop: () => void
}

export type LoomsFetchResult = Response | null

class RequestBodyError extends Data.TaggedError('RequestBodyError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({ cause, message: 'Invalid JSON request body' })
    this.name = 'RequestBodyError'
  }
}

class RequestQueryError extends Data.TaggedError('RequestQueryError')<{
  readonly message: string
}> {}

const StartRunBodySchema = Schema.Struct({
  kind: Schema.optional(Schema.String),
  definitionName: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  input: Schema.optional(JsonValueSchema),
  runId: Schema.optional(Schema.String),
  idempotencyKey: Schema.optional(Schema.String),
})

const SignalBodySchema = Schema.Struct({
  events: Schema.optional(
    Schema.Array(
      Schema.Struct({
        type: Schema.String,
        payload: JsonValueSchema,
        threadId: Schema.optional(Schema.NullOr(Schema.String)),
      }),
    ),
  ),
  type: Schema.optional(Schema.String),
  payload: Schema.optional(JsonValueSchema),
  threadId: Schema.optional(Schema.NullOr(Schema.String)),
  idempotencyKey: Schema.optional(Schema.String),
})

function extractIdempotencyKey(req: Request, bodyKey?: string): string | undefined {
  return (
    bodyKey ??
    req.headers.get('idempotency-key') ??
    req.headers.get('x-idempotency-key') ??
    undefined
  )
}

function provideStore<A, E>(
  effect: Effect.Effect<A, E, EventStoreTag>,
  store: EventStore,
): Effect.Effect<A, E> {
  return Effect.provideService(effect, EventStoreTag, store)
}

function acceptsEventStream(req: Request): boolean {
  return (req.headers.get('accept') ?? '')
    .split(',')
    .some((value) => value.split(';', 1)[0]?.trim().toLowerCase() === 'text/event-stream')
}

function wantsRunStream(req: Request, url: URL): boolean {
  return url.searchParams.get('stream') === 'true' || acceptsEventStream(req)
}

function wantsEventStream(req: Request, url: URL): boolean {
  const live = url.searchParams.get('live')
  return live === 'true' || live === '1' || acceptsEventStream(req)
}

function readIntegerQuery(
  url: URL,
  name: string,
  options: { minimum: number },
): Effect.Effect<number | null, RequestQueryError> {
  const raw = url.searchParams.get(name)

  if (raw === null) {
    return Effect.succeed(null)
  }

  const value = Number(raw)

  if (!Number.isSafeInteger(value) || value < options.minimum || raw.trim() === '') {
    return Effect.fail(
      new RequestQueryError({
        message: `${name} must be an integer greater than or equal to ${options.minimum}`,
      }),
    )
  }

  return Effect.succeed(value)
}

function readEventStreamFromSeq(req: Request, url: URL): Effect.Effect<number, RequestQueryError> {
  const lastEventId = req.headers.get('last-event-id')

  if (lastEventId !== null && lastEventId.trim() !== '') {
    const value = Number(lastEventId)

    if (!Number.isSafeInteger(value) || value < 0) {
      return Effect.fail(
        new RequestQueryError({
          message: 'Last-Event-ID must be a non-negative integer',
        }),
      )
    }

    return Effect.succeed(value + 1)
  }

  return readIntegerQuery(url, 'fromSeq', { minimum: 1 }).pipe(
    Effect.map((fromSeq) => fromSeq ?? 1),
  )
}

function streamStartRun(
  req: Request,
  runtime: LoomsRuntime,
  store: EventStore,
  args: {
    kind: string
    definitionName: string
    input: JsonValue
    runId: string
    idempotencyKey?: string
  },
): Response {
  return createEventStreamResponse({
    signal: req.signal,
    request: req,
    store,
    runId: args.runId,
    fromSeq: 1,
    onStart: (write, close) =>
      runtime
        .startRun({
          kind: args.kind,
          definitionName: args.definitionName,
          input: args.input,
          runId: args.runId,
          idempotencyKey: args.idempotencyKey,
        })
        .pipe(
          Effect.provideService(EventStoreTag, store),
          Effect.tap((result) =>
            Effect.sync(() => write(`event: done\ndata: ${stringifyJson(result)}\n\n`)),
          ),
          Effect.catch((error) =>
            Effect.sync(() =>
              write(`event: error\ndata: ${stringifyJson({ error: error.message })}\n\n`),
            ),
          ),
          Effect.ensuring(Effect.sync(close)),
          Effect.asVoid,
        ),
  })
}

const readJson = (req: Request): Effect.Effect<JsonValue, RequestBodyError> =>
  Effect.tryPromise({
    try: () => req.json(),
    catch: (cause) => new RequestBodyError(cause),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(JsonValueSchema)),
    Effect.mapError((cause) =>
      cause instanceof RequestBodyError ? cause : new RequestBodyError(cause),
    ),
  )

export function isLoomsApiPath(path: string): boolean {
  return path === '/health' || path === '/runs' || path.startsWith('/runs/')
}

function toErrorResponse(err: Error): Response {
  if (err instanceof RequestBodyError || err instanceof RequestQueryError) {
    return Response.json({ error: err.message }, { status: 400 })
  }

  if (err instanceof InvalidInputError || err instanceof InvalidEventError) {
    return Response.json({ error: err.message, issues: err.issues }, { status: 400 })
  }

  return Response.json({ error: err.message }, { status: 500 })
}

export function createFetchHandler(
  options: FetchHandlerOptions,
): (req: Request) => Promise<Response | null> {
  const { runtime, store } = options

  return (req) =>
    Effect.runPromise(
      Effect.gen(function* () {
        const url = new URL(req.url)
        const path = url.pathname

        if (!isLoomsApiPath(path)) {
          return null
        }

        const accept = req.headers.get('accept') ?? ''

        if (req.method === 'GET' && accept.includes('text/html') && !acceptsEventStream(req)) {
          return null
        }

        if (path === '/health') {
          return Response.json({ ok: true })
        }

        if (req.method === 'GET' && path === '/runs') {
          const runIds = yield* provideStore(runtime.listRuns, store)
          return Response.json({ runIds })
        }

        if (req.method === 'POST' && path === '/runs') {
          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(StartRunBodySchema)),
          )

          const definitionName = body.definitionName ?? body.name
          const kind = body.kind

          if (!definitionName || !kind) {
            return Response.json({ error: 'kind and definitionName required' }, { status: 400 })
          }

          const runId = body.runId ?? createRunId()
          const idempotencyKey = extractIdempotencyKey(req, body.idempotencyKey)

          if (wantsRunStream(req, url)) {
            return streamStartRun(req, runtime, store, {
              kind,
              definitionName,
              input: body.input ?? null,
              runId,
              idempotencyKey,
            })
          }

          const result = yield* provideStore(
            runtime.startRun({
              kind,
              definitionName,
              input: body.input ?? null,
              runId,
              idempotencyKey,
            }),
            store,
          )

          return Response.json(result)
        }

        const replayMatch = path.match(/^\/runs\/([^/]+)\/replay$/)

        if (req.method === 'GET' && replayMatch) {
          const runId = decodeURIComponent(replayMatch[1]!)
          const seq = Number(url.searchParams.get('seq') ?? '0')
          const step = yield* provideStore(runtime.replayTo(runId, seq), store)
          return Response.json({ runId, step })
        }

        const projectionMatch = path.match(/^\/runs\/([^/]+)\/projections\/([^/]+)$/)

        if (req.method === 'GET' && projectionMatch) {
          const runId = decodeURIComponent(projectionMatch[1]!)
          const name = decodeURIComponent(projectionMatch[2]!)
          const definition = runtime.registry.projections.get(name)

          if (!definition) {
            return Response.json({ error: `Unknown projection: ${name}` }, { status: 404 })
          }

          const value = yield* provideStore(runtime.project(runId, definition), store)
          return Response.json({ runId, name, value })
        }

        const eventsMatch = path.match(/^\/runs\/([^/]+)\/events$/)

        if (req.method === 'POST' && eventsMatch) {
          const runId = decodeURIComponent(eventsMatch[1]!)

          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(SignalBodySchema)),
          )

          const events =
            body.events ??
            (body.type
              ? [
                  {
                    type: body.type,
                    payload: body.payload ?? null,
                    threadId: body.threadId,
                  },
                ]
              : [])

          const idempotencyKey = extractIdempotencyKey(req, body.idempotencyKey)

          const state = yield* provideStore(
            runtime.signal(runId, events, { idempotencyKey }),
            store,
          )

          return Response.json({ runId, state })
        }

        if (req.method === 'GET' && eventsMatch) {
          const runId = decodeURIComponent(eventsMatch[1]!)

          if (wantsEventStream(req, url)) {
            return createEventStreamResponse({
              signal: req.signal,
              request: req,
              store,
              runId,
              fromSeq: yield* readEventStreamFromSeq(req, url),
            })
          }

          const fromSeq = (yield* readIntegerQuery(url, 'fromSeq', { minimum: 1 })) ?? undefined
          const limit = (yield* readIntegerQuery(url, 'limit', { minimum: 1 })) ?? undefined

          const events = yield* provideStore(runtime.getEvents(runId, { fromSeq, limit }), store)
          return Response.json({ runId, events }, { headers: { vary: 'accept' } })
        }

        const threadsMatch = path.match(/^\/runs\/([^/]+)\/(threads)$/)

        if (req.method === 'GET' && threadsMatch) {
          const runId = decodeURIComponent(threadsMatch[1]!)
          const state = yield* provideStore(runtime.getRun(runId), store)
          return Response.json({ runId, threads: state.threads })
        }

        const wakeMatch = path.match(/^\/runs\/([^/]+)\/wake$/)

        if (req.method === 'POST' && wakeMatch) {
          const runId = decodeURIComponent(wakeMatch[1]!)
          const state = yield* provideStore(runtime.wake(runId), store)
          return Response.json({ runId, state })
        }

        const runMatch = path.match(/^\/runs\/([^/]+)$/)

        if (req.method === 'GET' && runMatch) {
          const runId = decodeURIComponent(runMatch[1]!)
          const state = yield* provideStore(runtime.getRun(runId), store)
          return Response.json({ runId, state })
        }

        return new Response('Not Found', { status: 404 })
      }).pipe(Effect.catch((error) => Effect.succeed(toErrorResponse(error)))),
    )
}

export function serveHttp(
  fetchHandler: (req: Request) => Promise<Response | null>,
  options?: { port?: number; hostname?: string },
): RunningServer {
  const port = options?.port ?? 8787
  const hostname = options?.hostname ?? '0.0.0.0'

  const server = Bun.serve({
    port,
    hostname,
    idleTimeout: 0,
    fetch(req, srv) {
      srv.timeout(req, 0)
      return fetchHandler(req).then(
        (result) => result ?? new Response('Not Found', { status: 404 }),
      )
    },
  })

  return {
    port: server.port ?? port,
    stop: () => server.stop(true),
  }
}
