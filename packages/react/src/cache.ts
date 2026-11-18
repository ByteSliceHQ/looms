import { DateTime } from 'effect'

import { decodeLoomsEvent, encodeLoomsEvent, type EventEnvelope } from '@looms/core'

/**
 * Keeps a run's durable events on the device, so a store that has followed the run before starts
 * from them and downloads only what was appended since. Ephemeral events are never kept.
 *
 * `key` names one view of one run on one host. A store with a thread filter has its own key.
 */
export interface EventCache {
  /** The events kept for `key`, in sequence order. Empty when there are none. */
  load(key: string): Promise<readonly EventEnvelope[]>
  append(key: string, events: readonly EventEnvelope[]): Promise<void>
  /** Forgets `key`, as when the host's log turns out not to be the one that was kept. */
  clear(key: string): Promise<void>
}

/** An `EventCache` that lives as long as the page. Useful in tests and on hosts with no storage. */
export function memoryEventCache(): EventCache {
  const kept = new Map<string, EventEnvelope[]>()

  return {
    load: (key) => Promise.resolve(kept.get(key)?.slice() ?? []),
    append: (key, events) => {
      const list = kept.get(key) ?? []
      list.push(...events)
      kept.set(key, list)
      return Promise.resolve()
    },
    clear: (key) => {
      kept.delete(key)
      return Promise.resolve()
    },
  }
}

export interface IndexedDbEventCacheOptions {
  /** Database name. Defaults to `looms-events`. */
  name?: string
  /** How many runs to keep. The ones opened longest ago are dropped first. Defaults to 50. */
  maxRuns?: number
  /** Defaults to the global `indexedDB`. */
  indexedDB?: IDBFactory
}

/** What `decodeLoomsEvent` reads: the wire encoding of an event. */
type EventWireInput = Parameters<typeof decodeLoomsEvent>[0]

const EVENTS = 'events'
const RUNS = 'runs'

const nothing = (): readonly EventEnvelope[] => []
const ignore = () => undefined

function done<T>(request: IDBRequest<T>): Promise<T> {
  // IndexedDB reports through callbacks; this is the one place they become a promise.
  // oxlint-disable-next-line effecttsgo/new-promise
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB failed')))
  })
}

function settled(transaction: IDBTransaction): Promise<void> {
  // oxlint-disable-next-line effecttsgo/new-promise
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve())

    const fail = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))

    transaction.addEventListener('error', fail)
    transaction.addEventListener('abort', fail)
  })
}

function eventsOf(key: string): IDBKeyRange {
  return IDBKeyRange.bound([key, 0], [key, Number.MAX_SAFE_INTEGER])
}

function touch(transaction: IDBTransaction, key: string) {
  transaction
    .objectStore(RUNS)
    .put({ key, touchedAt: DateTime.toEpochMillis(DateTime.nowUnsafe()) })
}

/**
 * An `EventCache` in the browser's IndexedDB. Every failure is swallowed: a cache that cannot be
 * read is an empty cache, and one that cannot be written is simply not written, so the store
 * falls back to downloading the log.
 */
export function indexedDbEventCache(options: IndexedDbEventCacheOptions = {}): EventCache {
  const factory = options.indexedDB ?? globalThis.indexedDB
  const maxRuns = Math.max(1, options.maxRuns ?? 50)
  let opening: Promise<IDBDatabase> | undefined

  const open = (): Promise<IDBDatabase> => {
    if (opening) {
      return opening
    }

    const request = factory.open(options.name ?? 'looms-events', 1)

    request.addEventListener('upgradeneeded', () => {
      const db = request.result

      if (!db.objectStoreNames.contains(EVENTS)) {
        db.createObjectStore(EVENTS, { keyPath: ['key', 'seq'] })
      }

      if (!db.objectStoreNames.contains(RUNS)) {
        db.createObjectStore(RUNS, { keyPath: 'key' })
      }
    })

    opening = done(request)

    opening.catch(() => {
      opening = undefined
    })

    return opening
  }

  /** Drops the runs opened longest ago once more than `maxRuns` are kept. */
  const evict = (db: IDBDatabase): Promise<void> => {
    const transaction = db.transaction([EVENTS, RUNS], 'readwrite')

    const listed: Promise<{ key: string; touchedAt: number }[]> = done(
      transaction.objectStore(RUNS).getAll(),
    )

    return listed.then((runs) => {
      const stale = runs
        .toSorted((a, b) => b.touchedAt - a.touchedAt)
        .slice(maxRuns)
        .map((run) => run.key)

      for (const key of stale) {
        transaction.objectStore(EVENTS).delete(eventsOf(key))
        transaction.objectStore(RUNS).delete(key)
      }

      return settled(transaction)
    })
  }

  return {
    load: (key) => {
      if (!factory) {
        return Promise.resolve([])
      }

      return open()
        .then((db) => {
          const transaction = db.transaction([EVENTS, RUNS], 'readwrite')

          // Rows are what `append` wrote, which is the wire encoding of an event.
          const read: Promise<{ event: EventWireInput }[]> = done(
            transaction.objectStore(EVENTS).getAll(eventsOf(key)),
          )

          return read.then((rows) => {
            if (rows.length > 0) {
              touch(transaction, key)
            }

            return settled(transaction).then(() => {
              void evict(db).catch(ignore)

              return rows.map((row) => decodeLoomsEvent(row.event, ''))
            })
          })
        })
        .catch(nothing)
    },

    append: (key, events) => {
      if (!factory || events.length === 0) {
        return Promise.resolve()
      }

      return open()
        .then((db) => {
          const transaction = db.transaction([EVENTS, RUNS], 'readwrite')
          const store = transaction.objectStore(EVENTS)

          for (const event of events) {
            store.put({ key, seq: event.seq, event: encodeLoomsEvent(event) })
          }

          touch(transaction, key)

          return settled(transaction)
        })
        .catch(ignore) // Not kept. The store downloads these again next time.
    },

    clear: (key) => {
      if (!factory) {
        return Promise.resolve()
      }

      return open()
        .then((db) => {
          const transaction = db.transaction([EVENTS, RUNS], 'readwrite')
          transaction.objectStore(EVENTS).delete(eventsOf(key))
          transaction.objectStore(RUNS).delete(key)

          return settled(transaction)
        })
        .catch(ignore)
    },
  }
}
