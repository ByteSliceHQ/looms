import { Effect } from 'effect'

import { jsonSchemaOfInput, type JsonValue, type RegisteredDefinition } from '@looms/core'

import type { RouteOptions } from '../http'
import { route, type Route } from '../route-table'

export interface PublishedDefinition {
  readonly kind: string
  readonly name: string
  readonly version: string
  readonly description?: string
  /** JSON Schema derived from the definition's `input`. */
  readonly inputSchema?: JsonValue
}

function publishDefinition(definition: RegisteredDefinition): PublishedDefinition {
  return {
    kind: definition.kind,
    name: definition.name,
    version: definition.version,
    description: definition.description,
    inputSchema: jsonSchemaOfInput(definition.input),
  }
}

export function definitionRoutes({ runtime }: RouteOptions): readonly Route[] {
  return [
    route({
      method: 'GET',
      path: '/definitions',
      name: 'definitions.list',
      access: 'read',
      handle: () =>
        Effect.succeed(
          Response.json({
            definitions: runtime.registry.definitions.map(publishDefinition),
            projections: [...runtime.registry.projections.keys()],
          }),
        ),
    }),
  ]
}
