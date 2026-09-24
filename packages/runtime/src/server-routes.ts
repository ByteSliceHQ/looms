import { Data, Effect, Predicate, Schema } from 'effect'

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

import { RunOverloadedError, StartRunConflictError, type LoomsRuntime } from './runtime'
import { createEventStreamResponse } from './sse'

export interface FetchHandlerOptions {
  runtime: LoomsRuntime
  store: EventStore
  workerCallbackToken?: string
  /** Bearer token required by mutation-capable operational endpoints. */
  operationsToken?: string
}

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
  definitionVersion: Schema.optional(Schema.String),
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

const WorkerCallbackBodySchema = Schema.Struct({
  events: Schema.optional(
    Schema.Array(
      Schema.Struct({
        type: Schema.String,
        payload: JsonValueSchema,
        threadId: Schema.optional(Schema.NullOr(Schema.String)),
      }),
    ),
  ),
  error: Schema.optional(Schema.String),
})

type WorkerCallbackAction = 'started' | 'heartbeat' | 'complete' | 'fail' | 'cancelled'
type RouteAuthorization = 'operations' | 'worker-callback'
type RouteEffect = Effect.Effect<Response, Error>

interface RouteContext<TParams> {
  readonly req: Request
  readonly url: URL
  readonly params: TParams
}

type RouteParameterValue = string | number

interface RouteParameter<TName extends string, TValue extends RouteParameterValue> {
  readonly kind: 'parameter'
  readonly name: TName
  readonly matches: (value: string) => boolean
  readonly decode: (value: string) => TValue
}

type RouteSegment = string | RouteParameter<string, RouteParameterValue>
type RouteParameters<TSegments extends readonly RouteSegment[]> = {
  readonly [
    TSegment in Extract<
      TSegments[number],
      RouteParameter<string, RouteParameterValue>
    > as TSegment['name']
  ]: TSegment extends RouteParameter<string, infer TValue> ? TValue : never
}

interface Route<TSegments extends readonly RouteSegment[]> {
  readonly method: string
  readonly segments: TSegments
  readonly authorization?: RouteAuthorization
  readonly handle: (context: RouteContext<RouteParameters<TSegments>>) => RouteEffect
}

type AnyRoute = Route<readonly RouteSegment[]>

interface MatchedRoute {
  readonly route: AnyRoute
  readonly params: Readonly<Record<string, RouteParameterValue>>
}

const stringParameter = <const TName extends string>(
  name: TName,
): RouteParameter<TName, string> => ({
  kind: 'parameter',
  name,
  matches: isUriComponent,
  decode: decodeURIComponent,
})

function isUriComponent(value: string): boolean {
  try {
    decodeURIComponent(value)
    return true
  } catch {
    return false
  }
}

const integerParameter = <const TName extends string>(
  name: TName,
): RouteParameter<TName, number> => ({
  kind: 'parameter',
  name,
  matches: (value) => /^\d+$/.test(value),
  decode: Number,
})

const callbackActionParameter = (
  name: 'action',
): RouteParameter<'action', WorkerCallbackAction> => ({
  kind: 'parameter',
  name,
  matches: (value) => workerCallbackAction(value) !== null,
  decode: (value) => {
    const action = workerCallbackAction(value)

    if (action === null) {
      throw new Error(`Invalid worker callback action: ${value}`)
    }

    return action
  },
})

function defineRoute<const TSegments extends readonly RouteSegment[]>(
  method: string,
  segments: TSegments,
  handle: (context: RouteContext<RouteParameters<TSegments>>) => RouteEffect,
  authorization?: RouteAuthorization,
): Route<TSegments> {
  return { method, segments, authorization, handle }
}

function provideStore<A, E>(
  effect: Effect.Effect<A, E, EventStoreTag>,
  store: EventStore,
): Effect.Effect<A, E> {
  return Effect.provideService(effect, EventStoreTag, store)
}

function extractIdempotencyKey(req: Request, bodyKey?: string): string | undefined {
  return (
    bodyKey ??
    req.headers.get('idempotency-key') ??
    req.headers.get('x-idempotency-key') ??
    undefined
  )
}

function workerCallbackAction(value: string): WorkerCallbackAction | null {
  switch (value) {
    case 'started':
    case 'heartbeat':
    case 'complete':
    case 'fail':
    case 'cancelled':
      return value
    default:
      return null
  }
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
    definitionVersion?: string
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
          definitionVersion: args.definitionVersion,
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

function authorize(
  req: Request,
  authorization: RouteAuthorization | undefined,
  options: FetchHandlerOptions,
): Response | null {
  if (authorization === undefined) {
    return null
  }

  const token =
    authorization === 'operations' ? options.operationsToken : options.workerCallbackToken

  if (!token) {
    const error =
      authorization === 'operations'
        ? 'Operational endpoints are not configured'
        : 'Worker callbacks are not configured'

    return Response.json({ error }, { status: 503 })
  }

  return constantTimeEquals(req.headers.get('authorization') ?? '', `Bearer ${token}`)
    ? null
    : Response.json({ error: 'Unauthorized' }, { status: 401 })
}

function constantTimeEquals(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length)
  let difference = actual.length ^ expected.length

  for (let index = 0; index < length; index += 1) {
    difference |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0)
  }

  return difference === 0
}

function toErrorResponse(err: Error): Response {
  if (err instanceof RequestBodyError || err instanceof RequestQueryError) {
    return Response.json({ error: err.message }, { status: 400 })
  }

  if (err instanceof InvalidInputError || err instanceof InvalidEventError) {
    return Response.json({ error: err.message, issues: err.issues }, { status: 400 })
  }

  if (err instanceof RunOverloadedError) {
    return Response.json({ error: err.message }, { status: 429 })
  }

  if (err instanceof StartRunConflictError) {
    return Response.json({ error: err.message, mismatches: err.mismatches }, { status: 409 })
  }

  return Response.json({ error: err.message }, { status: 500 })
}

function matchRoute(req: Request, url: URL, routes: readonly AnyRoute[]): MatchedRoute | null {
  const pathSegments = url.pathname.split('/').slice(1)

  for (const route of routes) {
    if (route.method !== req.method || route.segments.length !== pathSegments.length) {
      continue
    }

    const params: Record<string, RouteParameterValue> = {}
    let matches = true

    for (let index = 0; index < route.segments.length; index += 1) {
      const routeSegment = route.segments[index]!
      const pathSegment = pathSegments[index]!

      if (Predicate.isString(routeSegment)) {
        if (routeSegment !== pathSegment) {
          matches = false
          break
        }

        continue
      }

      if (!routeSegment.matches(pathSegment)) {
        matches = false
        break
      }

      params[routeSegment.name] = routeSegment.decode(pathSegment)
    }

    if (matches) {
      return { route, params }
    }
  }

  return null
}

function createSystemRoutes(options: FetchHandlerOptions): readonly AnyRoute[] {
  const { runtime, store } = options

  return [
    defineRoute('GET', ['health'], () => Effect.succeed(Response.json({ ok: true }))),
    defineRoute('GET', ['runs'], () =>
      provideStore(runtime.listRuns, store).pipe(Effect.map((runIds) => Response.json({ runIds }))),
    ),
    defineRoute(
      'POST',
      ['operations', 'deadlines', 'rescan'],
      () =>
        provideStore(runtime.recoverDeadlines, store).pipe(
          Effect.map((scheduled) => Response.json({ scheduled })),
        ),
      'operations',
    ),
  ]
}

function createStartRoutes(options: FetchHandlerOptions): readonly AnyRoute[] {
  const { runtime, store } = options

  return [
    defineRoute('POST', ['runs'], ({ req, url }) =>
      Effect.gen(function* () {
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
            definitionVersion: body.definitionVersion,
            input: body.input ?? null,
            runId,
            idempotencyKey,
          })
        }

        const result = yield* provideStore(
          runtime.startRun({
            kind,
            definitionName,
            definitionVersion: body.definitionVersion,
            input: body.input ?? null,
            runId,
            idempotencyKey,
          }),
          store,
        )

        return Response.json(result)
      }),
    ),
  ]
}

function createWorkerCallbackRoutes(options: FetchHandlerOptions): readonly AnyRoute[] {
  const { runtime, store } = options
  const runId = stringParameter('runId')
  const effectId = stringParameter('effectId')
  const attempt = integerParameter('attempt')
  const action = callbackActionParameter('action')

  return [
    defineRoute(
      'POST',
      ['runs', runId, 'effects', effectId, attempt, action],
      ({ req, params }) =>
        Effect.gen(function* () {
          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(WorkerCallbackBodySchema)),
          )

          const callback = { effectId: params.effectId, attempt: params.attempt }
          let state

          switch (params.action) {
            case 'started':
              state = yield* provideStore(runtime.workerStarted(params.runId, callback), store)
              break
            case 'heartbeat':
              state = yield* provideStore(runtime.workerHeartbeat(params.runId, callback), store)
              break
            case 'complete':
              state = yield* provideStore(
                runtime.workerComplete(params.runId, { ...callback, events: body.events ?? [] }),
                store,
              )

              break
            case 'fail':
              if (!body.error) {
                return Response.json({ error: 'error required' }, { status: 400 })
              }

              state = yield* provideStore(
                runtime.workerFail(params.runId, { ...callback, error: body.error }),
                store,
              )

              break
            case 'cancelled':
              state = yield* provideStore(runtime.workerCancelled(params.runId, callback), store)
              break

            default: {
              const exhaustiveCheck: never = params.action
              return exhaustiveCheck
            }
          }

          return Response.json({ runId: params.runId, state })
        }),
      'worker-callback',
    ),
  ]
}

function createRunReadRoutes(options: FetchHandlerOptions): readonly AnyRoute[] {
  const { runtime, store } = options
  const runId = stringParameter('runId')
  const projectionName = stringParameter('projectionName')

  return [
    defineRoute('GET', ['runs', runId, 'replay'], ({ url, params }) =>
      provideStore(
        runtime.replayTo(params.runId, Number(url.searchParams.get('seq') ?? '0')),
        store,
      ).pipe(Effect.map((step) => Response.json({ runId: params.runId, step }))),
    ),
    defineRoute('GET', ['runs', runId, 'status'], ({ params }) =>
      provideStore(runtime.inspectRun(params.runId), store).pipe(
        Effect.map((status) => Response.json(status)),
      ),
    ),
    defineRoute('GET', ['runs', runId, 'effects'], ({ params }) =>
      provideStore(runtime.inspectRun(params.runId), store).pipe(
        Effect.map((status) => Response.json({ runId: params.runId, effects: status.effects })),
      ),
    ),
    defineRoute('GET', ['runs', runId, 'projections', projectionName], ({ params }) => {
      const definition = runtime.registry.projections.get(params.projectionName)

      if (!definition) {
        return Effect.succeed(
          Response.json({ error: `Unknown projection: ${params.projectionName}` }, { status: 404 }),
        )
      }

      return provideStore(runtime.project(params.runId, definition), store).pipe(
        Effect.map((value) =>
          Response.json({ runId: params.runId, name: params.projectionName, value }),
        ),
      )
    }),
    defineRoute('GET', ['runs', runId, 'events'], ({ req, url, params }) =>
      Effect.gen(function* () {
        if (wantsEventStream(req, url)) {
          return createEventStreamResponse({
            signal: req.signal,
            request: req,
            store,
            runId: params.runId,
            fromSeq: yield* readEventStreamFromSeq(req, url),
          })
        }

        const fromSeq = (yield* readIntegerQuery(url, 'fromSeq', { minimum: 1 })) ?? undefined
        const limit = (yield* readIntegerQuery(url, 'limit', { minimum: 1 })) ?? undefined

        const events = yield* provideStore(
          runtime.getEvents(params.runId, { fromSeq, limit }),
          store,
        )

        return Response.json({ runId: params.runId, events }, { headers: { vary: 'accept' } })
      }),
    ),
    defineRoute('GET', ['runs', runId, 'threads'], ({ params }) =>
      provideStore(runtime.getRun(params.runId), store).pipe(
        Effect.map((state) => Response.json({ runId: params.runId, threads: state.threads })),
      ),
    ),
    defineRoute('GET', ['runs', runId], ({ params }) =>
      provideStore(runtime.getRun(params.runId), store).pipe(
        Effect.map((state) => Response.json({ runId: params.runId, state })),
      ),
    ),
  ]
}

function createRunMutationRoutes(options: FetchHandlerOptions): readonly AnyRoute[] {
  const { runtime, store } = options
  const runId = stringParameter('runId')
  const effectId = stringParameter('effectId')

  return [
    defineRoute(
      'POST',
      ['runs', runId, 'effects', effectId, 'retry'],
      ({ params }) =>
        provideStore(runtime.retryEffect(params.runId, params.effectId), store).pipe(
          Effect.map((state) =>
            Response.json({ runId: params.runId, effectId: params.effectId, state }),
          ),
        ),
      'operations',
    ),
    defineRoute('POST', ['runs', runId, 'events'], ({ req, params }) =>
      Effect.gen(function* () {
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
          runtime.signal(params.runId, events, { idempotencyKey }),
          store,
        )

        return Response.json({ runId: params.runId, state })
      }),
    ),
    defineRoute('POST', ['runs', runId, 'wake'], ({ params }) =>
      provideStore(runtime.wake(params.runId), store).pipe(
        Effect.map((state) => Response.json({ runId: params.runId, state })),
      ),
    ),
  ]
}

function createRoutes(options: FetchHandlerOptions): readonly AnyRoute[] {
  return [
    ...createSystemRoutes(options),
    ...createStartRoutes(options),
    ...createWorkerCallbackRoutes(options),
    ...createRunReadRoutes(options),
    ...createRunMutationRoutes(options),
  ]
}

export function isLoomsApiPath(path: string): boolean {
  return (
    path === '/health' ||
    path === '/runs' ||
    path.startsWith('/runs/') ||
    path.startsWith('/operations/')
  )
}

export function createFetchHandler(
  options: FetchHandlerOptions,
): (req: Request) => Promise<Response | null> {
  const routes = createRoutes(options)

  return (req) => {
    const url = new URL(req.url)

    if (!isLoomsApiPath(url.pathname)) {
      return Promise.resolve(null)
    }

    const accept = req.headers.get('accept') ?? ''

    if (req.method === 'GET' && accept.includes('text/html') && !acceptsEventStream(req)) {
      return Promise.resolve(null)
    }

    return Effect.runPromise(
      Effect.gen(function* () {
        const matched = matchRoute(req, url, routes)

        if (!matched) {
          return new Response('Not Found', { status: 404 })
        }

        const denied = authorize(req, matched.route.authorization, options)

        if (denied) {
          return denied
        }

        return yield* matched.route.handle({
          req,
          url,
          params: matched.params,
        })
      }).pipe(
        Effect.catch((error) => Effect.succeed(toErrorResponse(error))),
        Effect.catchCause((cause) =>
          Effect.logError('[@looms/runtime] request failed', cause).pipe(
            Effect.as(Response.json({ error: 'Internal server error' }, { status: 500 })),
          ),
        ),
      ),
    )
  }
}
