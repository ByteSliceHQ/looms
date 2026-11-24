import { Effect } from 'effect'

import { snapshotStoreOf, withBlobOffload, type BlobStore, type EventStore } from '@looms/core'
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
  readonly scheduleProjectorRetry?: (at: number) => Effect.Effect<void>
  /** Offloads oversized event and snapshot JSON. See `withBlobOffload`. */
  readonly blobs?: BlobStore
}

export interface DurableObjectEventStore extends EventStore {
  readonly projectorDelivery?: ProjectorDelivery
}

/**
 * Creates an EventStore backed by a Durable Object's embedded SQLite database (`ctx.storage.sql`).
 * Optionally attaches projectors. With `scheduleProjectorRetry`, an append arms the alarm to
 * deliver at once rather than delivering under the request's `waitUntil`, which kept the
 * Durable Object's `fetch` response open for seconds of Hyperdrive/Postgres I/O after the handler
 * returned. Delivery runs from durable cursors, so a crashed one is retried on the next alarm.
 */
export function durableObjectEventStore(
  ctx: DurableObjectState,
  options: DurableObjectStoreOptions = {},
): DurableObjectEventStore {
  const exec = sqlStorageExec(ctx.storage.sql, {
    // DO SQLite rejects BEGIN/COMMIT/ROLLBACK; use the storage transaction API.
    transaction: (fn) => ctx.storage.transactionSync(fn),
  })

  const sqlite = sqliteEventStore({ exec })
  const snapshots = snapshotStoreOf(sqlite)

  const store = options.blobs
    ? withBlobOffload(sqlite, options.blobs, snapshots ? { snapshots } : undefined)
    : sqlite

  if (options.projectors && options.projectors.length > 0) {
    const delivery = createProjectorDelivery(
      store,
      options.projectors,
      sqliteProjectorCursorStore(exec),
      { scheduleRetry: options.scheduleProjectorRetry },
    )

    const wrapped = withProjectors(store, options.projectors, {
      delivery,
      scheduleDelivery: (_runId, work) => {
        // The alarm delivers instead of this request, so the append's response is not held
        // open by projector I/O. Without an alarm to arm, fall back to waitUntil.
        if (options.scheduleProjectorRetry) {
          void Effect.runPromise(options.scheduleProjectorRetry(Date.now()))
          return
        }

        ctx.waitUntil(Effect.runPromise(work))
      },
    })

    return Object.assign(wrapped, { projectorDelivery: delivery })
  }

  return store
}
