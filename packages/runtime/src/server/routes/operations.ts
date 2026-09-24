import { Effect } from 'effect'

import { provideStore, type RouteOptions } from '../http'
import { route, type Route } from '../route-table'

export function operationRoutes({ runtime, store }: RouteOptions): readonly Route[] {
  return [
    route({
      method: 'POST',
      path: '/operations/deadlines/rescan',
      name: 'operations.rescanDeadlines',
      access: 'operations',
      handle: () =>
        provideStore(runtime.recoverDeadlines, store).pipe(
          Effect.map((scheduled) => Response.json({ scheduled })),
        ),
    }),
  ]
}
