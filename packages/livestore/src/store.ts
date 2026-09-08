import {
  decodeLoomsEvent,
  project,
  type EventEnvelope,
  type EventInput,
  type ProjectionDefinition,
} from '@looms/core'
import { emptyTables, type MaterializedTables } from './tables'
import { materializeEvents } from './materialize'

export type StoreListener = (tables: MaterializedTables) => void

export interface LoomsClientStoreOptions {
  /** Run id / LiveStore store id. */
  storeId: string
  /**
   * Base URL of the Looms host (e.g. http://127.0.0.1:8787).
   * Polls `${endpoint}/runs/:id/events` by default.
   */
  endpoint: string
  pollIntervalMs?: number
  fetch?: typeof fetch
}

export interface LoomsStoreQuery {
  events: () => EventEnvelope[]
  runs: () => MaterializedTables['runs']
  threads: () => MaterializedTables['threads']
}

export interface LoomsClientStore {
  storeId: string
  getState: () => MaterializedTables
  events: () => EventEnvelope[]
  query: LoomsStoreQuery
  subscribe: (listener: StoreListener) => () => void
  project<S>(definition: ProjectionDefinition<S>): S
  commit: (event: EventInput) => Promise<void>
  sync: () => Promise<void>
  dispose: () => void
}

/**
 * In-memory client store that polls a run's event log and materializes
 * generic `runs` / `threads` / `events_log` tables.
 */
export function createLoomsStore(options: LoomsClientStoreOptions): LoomsClientStore {
  const endpoint = options.endpoint.replace(/\/$/, '')
  const fetchFn = options.fetch ?? fetch
  const pollIntervalMs = options.pollIntervalMs ?? 750
  const listeners = new Set<StoreListener>()
  const events: EventEnvelope[] = []
  let tables = emptyTables()
  let fromSeq = 1
  let disposed = false
  let timer: ReturnType<typeof setInterval> | undefined
  let syncing: Promise<void> | null = null

  const notify = () => {
    for (const listener of listeners) listener(tables)
  }

  const applyBatch = (batch: EventEnvelope[]) => {
    if (batch.length === 0) return
    tables = materializeEvents(batch, tables)
    for (const event of batch) {
      events.push(event)
      fromSeq = Math.max(fromSeq, event.seq + 1)
    }
    notify()
  }

  const pull = async () => {
    const url = `${endpoint}/runs/${encodeURIComponent(options.storeId)}/events?fromSeq=${fromSeq}`
    const res = await fetchFn(url)
    if (!res.ok) {
      if (res.status === 404 || res.status === 416) return
      const text = await res.text()
      if (text.includes('out of range') || text.includes('Range not satisfiable')) return
      throw new Error(`run events pull failed: ${res.status}`)
    }
    // SAFETY: host returns { events: EventEnvelope[] }.
    const body = (await res.json()) as { events?: unknown[] }
    applyBatch(
      (body.events ?? []).map((raw) =>
        decodeLoomsEvent(
          // SAFETY: host event JSON is EventEnvelope | LiveStoreGlobalEncoded.
          raw as Parameters<typeof decodeLoomsEvent>[0],
          options.storeId,
        ),
      ),
    )
  }

  const sync = async () => {
    if (disposed) return
    if (syncing) return syncing
    syncing = (async () => {
      try {
        await pull()
      } finally {
        syncing = null
      }
    })()
    return syncing
  }

  const startPolling = () => {
    disposed = false
    void sync().catch(() => {
      // transient network errors are ignored; next tick retries
    })
    if (timer !== undefined) return
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
    events: () => events.slice(),
    query: {
      events: () => events.slice(),
      runs: () => tables.runs,
      threads: () => tables.threads,
    },
    subscribe: (listener) => {
      listeners.add(listener)
      listener(tables)
      startPolling()
      return () => {
        listeners.delete(listener)
      }
    },
    project: (definition) => project(definition, events),
    sync,
    commit: async (event) => {
      const res = await fetchFn(`${endpoint}/runs/${encodeURIComponent(options.storeId)}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`run signal failed: ${res.status} ${text}`)
      }
      await sync()
    },
    dispose: () => {
      disposed = true
      if (timer !== undefined) {
        clearInterval(timer)
        timer = undefined
      }
      listeners.clear()
    },
  }

  return store
}
