import { Effect } from 'effect'

import { publishDefinition, type DefinitionCatalog } from '@looms/core'

import type { RouteOptions } from '../http'
import { route, type Route } from '../route-table'

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
        }

        return Effect.succeed(Response.json(catalog))
      },
    }),
    route({
      method: 'GET',
      path: '/definitions/effect-placements',
      name: 'definitions.effectPlacements',
      access: 'read',
      handle: () => Effect.succeed(Response.json({ effects: runtime.effectPlacements })),
    }),
  ]
}
