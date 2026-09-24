import type { EventStore } from '@looms/core'
import { sqliteEventStore, sqlStorageExec } from '@looms/core/sqlite-store'
import {
  createProjectorDelivery,
  sqliteProjectorCursorStore,
  withProjectors,
  type Projector,
  type ProjectorDelivery,
} from '@looms/projectors'

export interface DurableObjectStoreOptions {
  readonly projectors?: readonly Projector[]
  readonly scheduleProjectorRetry?: (at: number) => Promise<void>
}

export interface DurableObjectEventStore extends EventStore {
  readonly projectorDelivery?: ProjectorDelivery
}

/**
 * Creates an EventStore backed by a Durable Object's embedded SQLite database (`ctx.storage.sql`).
 * Optionally attaches asynchronous projectors (such as S2).
 */
export function durableObjectEventStore(
  ctx: DurableObjectState,
  options: DurableObjectStoreOptions = {},
): DurableObjectEventStore {
  const exec = sqlStorageExec(ctx.storage.sql, {
    // DO SQLite rejects BEGIN/COMMIT/ROLLBACK; use the storage transaction API.
    transaction: (fn) => ctx.storage.transactionSync(fn),
  })

  const store = sqliteEventStore({ exec })

  if (options.projectors && options.projectors.length > 0) {
    const delivery = createProjectorDelivery(
      store,
      options.projectors,
      sqliteProjectorCursorStore(exec),
      { scheduleRetry: options.scheduleProjectorRetry },
    )

    const wrapped = withProjectors(store, options.projectors, { delivery })
    return Object.assign(wrapped, { projectorDelivery: delivery })
  }

  return store
}
