import { Effect, Schema } from 'effect'

import type { WorkerCallbackInput, WorkerCallbackKind } from '@looms/core'

import { EventInputBodySchema, provideStore, readJson, type RouteOptions } from '../http'
import { integer, oneOf, route, type Route } from '../route-table'

const WORKER_CALLBACK_KINDS = [
  'started',
  'heartbeat',
  'complete',
  'fail',
  'cancelled',
] as const satisfies readonly WorkerCallbackKind[]

const WorkerCallbackBodySchema = Schema.Struct({
  events: Schema.optional(Schema.Array(EventInputBodySchema)),
  error: Schema.optional(Schema.String),
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
    case 'fail':
      return body.error ? { ...callback, kind: 'fail', error: body.error } : null
    default:
      return { ...callback, kind: params.action }
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

          const state = yield* provideStore(runtime.workerCallback(params.runId, input), store)
          return Response.json({ runId: params.runId, state })
        }),
    }),
  ]
}
