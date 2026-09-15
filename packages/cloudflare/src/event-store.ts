import type { EventStore } from '@looms/core'
import { sqliteEventStore, sqlStorageExec } from '@looms/core/sqlite-store'
import { withProjectors, type Projector } from '@looms/projectors'

export interface DurableObjectStoreOptions {
  readonly projectors?: readonly Projector[]
}

/**
 * Creates an EventStore backed by a Durable Object's embedded SQLite database (`ctx.storage.sql`).
 * Optionally attaches asynchronous projectors (such as S2).
 */
export function durableObjectEventStore(
  ctx: DurableObjectState,
  options: DurableObjectStoreOptions = {},
): EventStore {
  const store = sqliteEventStore({
    exec: sqlStorageExec(ctx.storage.sql, {
      // DO SQLite rejects BEGIN/COMMIT/ROLLBACK; use the storage transaction API.
      transaction: (fn) => ctx.storage.transactionSync(fn),
    }),
  })

  if (options.projectors && options.projectors.length > 0) {
    return withProjectors(store, options.projectors)
  }

  return store
}
