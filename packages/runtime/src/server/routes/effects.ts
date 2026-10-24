import { Effect, Schema } from 'effect'

import {
  JsonValueSchema,
  type JsonValue,
  type WorkerCallbackInput,
  type WorkerCallbackKind,
} from '@looms/core'

import { EventInputBodySchema, provideStore, readJson, type RouteOptions } from '../http'
import { integer, oneOf, route, type Route } from '../route-table'

const WORKER_CALLBACK_KINDS = [
  'started',
  'heartbeat',
  'complete',
  'fail',
  'cancelled',
] as const satisfies readonly WorkerCallbackKind[]

interface FailWorkerCallback {
  effectId: string
  attempt: number
  kind: 'fail'
  error: string
  nonRetryable?: boolean
  retryAfterMs?: number
}

interface HeartbeatWorkerCallback {
  effectId: string
  attempt: number
  kind: 'heartbeat'
  details?: JsonValue
}

const WorkerCallbackBodySchema = Schema.Struct({
  events: Schema.optional(Schema.Array(EventInputBodySchema)),
  error: Schema.optional(Schema.String),
  nonRetryable: Schema.optional(Schema.Boolean),
  retryAfterMs: Schema.optional(Schema.Finite),
  details: Schema.optional(JsonValueSchema),
})

function workerCallbackInput(
  params: {
    readonly effectId: string
    readonly attempt: number
    readonly action: WorkerCallbackKind
  },
  body: Schema.Schema.Type<typeof WorkerCallbackBodySchema>,
): WorkerCallbackInput | null {
  const callback = { effectId: params.effectId, attempt: params.attempt }

  switch (params.action) {
    case 'complete':
      return { ...callback, kind: 'complete', events: body.events ?? [] }

    case 'fail': {
      if (body.error === undefined) {
        return null
      }

      const failure: FailWorkerCallback = {
        ...callback,
        kind: 'fail',
        error: body.error,
      }

      if (body.nonRetryable !== undefined) {
        failure.nonRetryable = body.nonRetryable
      }

      if (body.retryAfterMs !== undefined) {
        failure.retryAfterMs = body.retryAfterMs
      }

      return failure
    }

    case 'heartbeat': {
      const heartbeat: HeartbeatWorkerCallback = { ...callback, kind: 'heartbeat' }

      if (body.details !== undefined) {
        heartbeat.details = body.details
      }

      return heartbeat
    }

    case 'started':
    case 'cancelled':
      return { ...callback, kind: params.action }

    default: {
      const exhaustive: never = params.action
      return exhaustive
    }
  }
}

export function effectRoutes({ runtime, store }: RouteOptions): readonly Route[] {
  return [
    route({
      method: 'GET',
      path: '/runs/:runId/effects',
      name: 'effects.list',
      access: 'read',
      handle: ({ params }) =>
        provideStore(runtime.inspectRun(params.runId), store).pipe(
          Effect.map((status) => Response.json({ runId: params.runId, effects: status.effects })),
        ),
    }),
    route({
      method: 'POST',
      path: '/runs/:runId/effects/:effectId/retry',
      name: 'effects.retry',
      access: 'operations',
      handle: ({ params }) =>
        provideStore(runtime.retryEffect(params.runId, params.effectId), store).pipe(
          Effect.map((state) =>
            Response.json({ runId: params.runId, effectId: params.effectId, state }),
          ),
        ),
    }),
    route({
      method: 'POST',
      path: '/runs/:runId/effects/:effectId/:attempt/secrets',
      name: 'effects.workerSecrets',
      access: 'worker',
      params: { attempt: integer },
      handle: ({ params }) =>
        provideStore(
          runtime.workerSecrets(params.runId, {
            effectId: params.effectId,
            attempt: params.attempt,
          }),
          store,
        ).pipe(
          Effect.map((result) =>
            Response.json(result, { headers: { 'cache-control': 'no-store' } }),
          ),
        ),
    }),
    route({
      method: 'POST',
      path: '/runs/:runId/effects/:effectId/:attempt/:action',
      name: 'effects.workerCallback',
      access: 'worker',
      params: { attempt: integer, action: oneOf(WORKER_CALLBACK_KINDS) },
      handle: ({ req, params }) =>
        Effect.gen(function* () {
          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(WorkerCallbackBodySchema)),
          )

          const input = workerCallbackInput(params, body)

          if (!input) {
            return Response.json({ error: 'error required' }, { status: 400 })
          }

          const result = yield* provideStore(runtime.workerCallback(params.runId, input), store)
          return Response.json(result)
        }),
    }),
  ]
}
