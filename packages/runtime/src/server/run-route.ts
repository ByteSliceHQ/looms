import { Effect } from 'effect'

import {
  EventStoreTag,
  hasEntries,
  isJsonObject,
  readAttributes,
  type EventStore,
  type RunAttributes,
} from '@looms/core'

import type { LoomsRuntime } from '../runtime'
import type { AuthorizedAccess, RouteInfo } from './auth'

const noAttributes: RunAttributes = {}

/**
 * Attributes are immutable and recorded on `runtime.run.started`, which is seq 1 of every
 * untrimmed log, forks included. Only a trimmed log needs the snapshot-backed fold.
 */
export function readStoredAttributes(
  runtime: LoomsRuntime,
  store: EventStore,
  runId: string,
): Effect.Effect<RunAttributes, Error> {
  const folded = runtime.getRun(runId).pipe(
    Effect.provideService(EventStoreTag, store),
    Effect.map((state) => state.attributes),
  )

  return store.read(runId, { fromSeq: 1, limit: 1 }).pipe(
    Effect.flatMap(([first]) => {
      if (first === undefined) {
        return Effect.succeed(noAttributes)
      }

      if (first.type === 'runtime.run.started' && isJsonObject(first.payload)) {
        return Effect.succeed(readAttributes(first.payload.attributes))
      }

      return folded
    }),
    Effect.catch(() => folded),
  )
}

/**
 * What `authorize` sees for a request about one run: the run's attributes are included when it has
 * any. Every path that serves a run, including a WebSocket upgrade, authorizes through this.
 */
export function runRouteInfo(
  runtime: LoomsRuntime,
  store: EventStore,
  route: { readonly access: AuthorizedAccess; readonly name: string; readonly runId: string },
): Effect.Effect<RouteInfo, Error> {
  return readStoredAttributes(runtime, store, route.runId).pipe(
    Effect.map((attributes) => (hasEntries(attributes) ? { ...route, attributes } : route)),
  )
}
