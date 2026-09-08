import {
  decodeLoomsEvent,
  encodeAppendableLoomsEvent,
  eventFromSignal,
  type LiveStoreGlobalEncoded,
  type LoomsEvent,
  type LoomsEventSignal,
} from '@looms/core'
import { emptyTables, type EventRow, type MaterializedTables, type MessageRow, type NodeRow, type ReviewRow, type ActorRow } from './tables'
import { materializeEvents } from './materialize'

export type StoreListener = (tables: MaterializedTables) => void

export interface LoomsClientStoreOptions {
  /** Actor / LiveStore id. */
  storeId: string
  /**
   * Base URL of the Looms host (e.g. http://127.0.0.1:8787).
   * Polls `${endpoint}/api/livestore?storeId=` by default.
   */
  endpoint: string
  pollIntervalMs?: number
  fetch?: typeof fetch
}

export interface LoomsStoreQuery {
  messages: (actorId?: string) => MessageRow[]
  reviews: (actorId?: string) => ReviewRow[]
  nodes: (actorId?: string) => NodeRow[]
  events: (actorId?: string) => EventRow[]
  actors: () => ActorRow[]
}

export interface LoomsClientStore {
  storeId: string
  getState: () => MaterializedTables
  query: LoomsStoreQuery
  subscribe: (listener: StoreListener) => () => void
  /**
   * Push a client event via the LiveStore proxy.
   * Intended for `review.decided` and `agent.message.received`.
   */
  commit: (eventPartial: LoomsEventSignal) => Promise<void>
  /** Pull once from the endpoint. */
  sync: () => Promise<void>
  dispose: () => void
}

function makeQuery(getTables: () => MaterializedTables): LoomsStoreQuery {
  return {
    messages: (actorId) => {
      const msgs = getTables().messages
      return actorId ? msgs.filter((m) => m.actorId === actorId) : msgs
    },
    reviews: (actorId) => {
      const rows = [...getTables().reviews.values()]
      return actorId ? rows.filter((r) => r.actorId === actorId) : rows
    },
    nodes: (actorId) => {
      const rows = [...getTables().nodes.values()]
      return actorId ? rows.filter((n) => n.actorId === actorId) : rows
    },
    events: (actorId) => {
      const evts = getTables().events
      return actorId ? evts.filter((e) => e.actorId === actorId) : evts
    },
    actors: () => [...getTables().actors.values()],
  }
}

/**
 * In-memory client store that polls Looms HTTP and materializes events.
 *
 * ```ts
 * const store = createLoomsStore({
 *   storeId: actorId,
 *   endpoint: 'http://127.0.0.1:8787',
 *   pollIntervalMs: 500,
 * })
 * store.subscribe((tables) => console.log(tables.reviews.size))
 * await store.commit({
 *   type: 'review.decided',
 *   payload: { reviewId, actionId: 'approve', outcome: 'approve' },
 * })
 * ```
 *
 * For full LiveStore + React, use `@looms/livestore/react`
 * (`useActorStore` / `LoomsLiveStoreProvider`).
 */
export function createLoomsStore(options: LoomsClientStoreOptions): LoomsClientStore {
  const endpoint = options.endpoint.replace(/\/$/, '')
  const fetchFn = options.fetch ?? fetch
  const pollIntervalMs = options.pollIntervalMs ?? 750
  const listeners = new Set<StoreListener>()
  let tables = emptyTables()
  let cursor = 0
  let disposed = false
  let timer: ReturnType<typeof setInterval> | undefined
  let syncing: Promise<void> | null = null

  const notify = () => {
    for (const listener of listeners) listener(tables)
  }

  const applyBatch = (events: LoomsEvent[]) => {
    if (events.length === 0) return
    tables = materializeEvents(events, tables)
    const last = events[events.length - 1]
    if (last) cursor = Math.max(cursor, last.seq)
    notify()
  }

  const pullLivestore = async () => {
    const url = `${endpoint}/api/livestore?storeId=${encodeURIComponent(options.storeId)}&cursor=${cursor}`
    const res = await fetchFn(url)
    if (!res.ok) throw new Error(`livestore pull failed: ${res.status}`)
    // SAFETY: response JSON is an object; batch items are decoded with canonical codec.
    const body = (await res.json()) as { batch?: LiveStoreGlobalEncoded[]; head?: number; cursor?: number }
    applyBatch(
      (body.batch ?? []).map((raw) => decodeLoomsEvent(raw, options.storeId)),
    )
    if (body.head !== undefined) cursor = Math.max(cursor, body.head)
    else if (body.cursor !== undefined) cursor = Math.max(cursor, body.cursor)
  }

  const sync = async () => {
    if (disposed) return
    if (syncing) return syncing
    syncing = (async () => {
      try {
        await pullLivestore()
      } finally {
        syncing = null
      }
    })()
    return syncing
  }

  const startPolling = () => {
    void sync()
    timer = setInterval(() => {
      void sync().catch(() => {
        // transient network errors are ignored; next tick retries
      })
    }, pollIntervalMs)
  }

  startPolling()

  const store: LoomsClientStore = {
    storeId: options.storeId,
    getState: () => tables,
    query: makeQuery(() => tables),
    subscribe: (listener) => {
      listeners.add(listener)
      listener(tables)
      return () => {
        listeners.delete(listener)
      }
    },
    sync,
    commit: async (eventPartial) => {
      const event = eventFromSignal(eventPartial, options.storeId)
      const encoded = encodeAppendableLoomsEvent(event, { parentSeqNum: cursor })
      const res = await fetchFn(`${endpoint}/api/livestore`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storeId: options.storeId,
          batch: [encoded],
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`livestore commit failed: ${res.status} ${text}`)
      }
      await sync()
    },
    dispose: () => {
      disposed = true
      if (timer) clearInterval(timer)
      listeners.clear()
    },
  }

  return store
}
