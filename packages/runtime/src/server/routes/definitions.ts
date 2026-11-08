import { Effect, Schema } from 'effect'

import {
  findSignal,
  JsonValueSchema,
  publishDefinition,
  publishEffects,
  publishEvents,
  publishModules,
  publishSignals,
  runSignal,
  validateEventInput,
  type DefinitionCatalog,
  type EventInput,
} from '@looms/core'

import { EventInputBodySchema, readJson, type RouteOptions } from '../http'
import { route, type Route } from '../route-table'

const PreviewSignalBodySchema = Schema.Struct({
  input: Schema.optional(JsonValueSchema),
  threadId: Schema.optional(Schema.String),
})

const PreviewEventsBodySchema = Schema.Struct({
  events: Schema.Array(EventInputBodySchema),
})

export function definitionRoutes({ runtime }: RouteOptions): readonly Route[] {
  return [
    route({
      method: 'GET',
      path: '/definitions',
      name: 'definitions.list',
      access: 'read',
      handle: () => {
        const catalog: DefinitionCatalog = {
          definitions: runtime.registry.definitions.map(publishDefinition),
          projections: [...runtime.registry.projections.keys()],
          modules: publishModules(runtime.registry.modules),
        }

        return Effect.succeed(Response.json(catalog))
      },
    }),
    route({
      method: 'GET',
      path: '/definitions/effects',
      name: 'definitions.effects',
      access: 'read',
      handle: () =>
        Effect.succeed(
          Response.json({ effects: publishEffects(runtime.registry.effects.values()) }),
        ),
    }),
    route({
      method: 'GET',
      path: '/definitions/signals',
      name: 'definitions.signals',
      access: 'read',
      handle: () =>
        Effect.succeed(Response.json({ signals: publishSignals(runtime.registry.modules) })),
    }),
    route({
      method: 'GET',
      path: '/definitions/events',
      name: 'definitions.events',
      access: 'read',
      handle: () =>
        Effect.succeed(Response.json({ events: publishEvents(runtime.registry.modules) })),
    }),
    route({
      method: 'POST',
      path: '/definitions/signals/:namespace/:name/preview',
      name: 'definitions.signals.preview',
      access: 'read',
      handle: ({ req, params }): Effect.Effect<Response, Error> =>
        // SAFETY: Effect.gen residual R is never here; Schema.decode errors become RequestBodyError via toErrorResponse.
        Effect.gen(function* () {
          const definition = findSignal(runtime.registry.modules, params.namespace, params.name)

          if (!definition) {
            return Response.json(
              { error: `Unknown signal ${params.namespace}.${params.name}` },
              { status: 404 },
            )
          }

          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(PreviewSignalBodySchema)),
          )

          const events = yield* runSignal(definition, body.input ?? null, body.threadId)

          return Response.json({ events })
        }) as Effect.Effect<Response, Error>,
    }),
    route({
      method: 'POST',
      path: '/definitions/events/preview',
      name: 'definitions.events.preview',
      access: 'read',
      handle: ({ req }): Effect.Effect<Response, Error> =>
        // SAFETY: Effect.gen residual R is never here; validateEventInput failures are already in the Error channel.
        Effect.gen(function* () {
          const body = yield* readJson(req).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(PreviewEventsBodySchema)),
          )

          const events: EventInput[] = []

          for (const input of body.events) {
            events.push(yield* validateEventInput(runtime.registry.catalogs, input))
          }

          return Response.json({ events })
        }) as Effect.Effect<Response, Error>,
    }),
  ]
}
