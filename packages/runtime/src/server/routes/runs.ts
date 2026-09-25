import { Effect, Schema } from 'effect'

import {
  createRunId,
  EventStoreTag,
  JsonValueSchema,
  stringifyJson,
  type EventStore,
  type JsonValue,
} from '@looms/core'

import type { LoomsRuntime } from '../../runtime'
import { createEventStreamResponse } from '../../sse'
import {
  acceptsEventStream,
  EventInputBodySchema,
  extractIdempotencyKey,
  provideStore,
  readIntegerQuery,
  readJson,
  RequestQueryError,
  type RouteOptions,
} from '../http'
import { route, type Route } from '../route-table'

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
  events: Schema.optional(Schema.Array(EventInputBodySchema)),
  type: Schema.optional(Schema.String),
  payload: Schema.optional(JsonValueSchema),
  threadId: Schema.optional(Schema.NullOr(Schema.String)),
  idempotencyKey: Schema.optional(Schema.String),
})

function wantsRunStream(req: Request, url: URL): boolean {
  return url.searchParams.get('stream') === 'true' || acceptsEventStream(req)
}

function wantsEventStream(req: Request, url: URL): boolean {
  const live = url.searchParams.get('live')
  return live === 'true' || live === '1' || acceptsEventStream(req)
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

export function runRoutes({ runtime, store }: RouteOptions): readonly Route[] {
  return [
    route({
      method: 'GET',
      path: '/health',
      name: 'health',
      access: 'public',
      handle: () => Effect.succeed(Response.json({ ok: true })),
    }),
    route({
      method: 'GET',
      path: '/runs',
      name: 'runs.list',
      access: 'read',
      handle: () =>
        provideStore(
          runtime.listRuns.pipe(Effect.map((runIds) => Response.json({ runIds }))),
          store,
        ),
    }),
    route({
      method: 'GET',
      path: '/runs/summaries',
      name: 'runs.summaries',
      access: 'read',
      handle: () =>
        provideStore(
          runtime.listRunSummaries.pipe(Effect.map((runs) => Response.json({ runs }))),
          store,
        ),
    }),
    route({
      method: 'POST',
      path: '/runs',
      name: 'runs.start',
      access: 'write',
      handle: ({ req, url }) =>
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

          const args = {
            kind,
            definitionName,
            definitionVersion: body.definitionVersion,
            input: body.input ?? null,
            runId,
            idempotencyKey,
          }

          if (wantsRunStream(req, url)) {
            return streamStartRun(req, runtime, store, args)
          }

          const result = yield* provideStore(runtime.startRun(args), store)
          return Response.json(result)
        }),
    }),
    route({
      method: 'GET',
      path: '/runs/:runId/replay',
      name: 'runs.replay',
      access: 'read',
      handle: ({ url, params }) =>
        provideStore(
          runtime.replayTo(params.runId, Number(url.searchParams.get('seq') ?? '0')),
          store,
        ).pipe(Effect.map((step) => Response.json({ runId: params.runId, step }))),
    }),
    route({
      method: 'GET',
      path: '/runs/:runId/status',
      name: 'runs.status',
      access: 'read',
      handle: ({ params }) =>
        provideStore(runtime.inspectRun(params.runId), store).pipe(
          Effect.map((status) => Response.json(status)),
        ),
    }),
    route({
      method: 'GET',
      path: '/runs/:runId/projections/:projectionName',
      name: 'runs.projection',
      access: 'read',
      handle: ({ params }) => {
        const definition = runtime.registry.projections.get(params.projectionName)

        if (!definition) {
          return Effect.succeed(
            Response.json(
              { error: `Unknown projection: ${params.projectionName}` },
              { status: 404 },
            ),
          )
        }

        return provideStore(runtime.project(params.runId, definition), store).pipe(
          Effect.map((value) =>
            Response.json({ runId: params.runId, name: params.projectionName, value }),
          ),
        )
      },
    }),
    route({
      method: 'GET',
      path: '/runs/:runId/events',
      name: 'runs.events',
      access: 'read',
      handle: ({ req, url, params }) =>
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
    }),
    route({
      method: 'GET',
      path: '/runs/:runId/threads',
      name: 'runs.threads',
      access: 'read',
      handle: ({ params }) =>
        provideStore(runtime.getRun(params.runId), store).pipe(
          Effect.map((state) => Response.json({ runId: params.runId, threads: state.threads })),
        ),
    }),
    route({
      method: 'GET',
      path: '/runs/:runId',
      name: 'runs.get',
      access: 'read',
      handle: ({ params }) =>
        provideStore(runtime.getRun(params.runId), store).pipe(
          Effect.map((state) => Response.json({ runId: params.runId, state })),
        ),
    }),
    route({
      method: 'POST',
      path: '/runs/:runId/events',
      name: 'runs.signal',
      access: 'write',
      handle: ({ req, params }) =>
        Effect.gen(function* () {
          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(SignalBodySchema)),
          )

          const events =
            body.events ??
            (body.type
              ? [{ type: body.type, payload: body.payload ?? null, threadId: body.threadId }]
              : [])

          const idempotencyKey = extractIdempotencyKey(req, body.idempotencyKey)

          const state = yield* provideStore(
            runtime.signal(params.runId, events, { idempotencyKey }),
            store,
          )

          return Response.json({ runId: params.runId, state })
        }),
    }),
    route({
      method: 'POST',
      path: '/runs/:runId/wake',
      name: 'runs.wake',
      access: 'write',
      handle: ({ params }) =>
        provideStore(runtime.wake(params.runId), store).pipe(
          Effect.map((state) => Response.json({ runId: params.runId, state })),
        ),
    }),
  ]
}
