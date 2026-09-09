import {
  decodeLoomsEvent,
  project,
  type EventEnvelope,
  type EventInput,
  type ProjectionDefinition,
} from '@looms/core'
import { Predicate } from 'effect'
import { emptyTables, type MaterializedTables } from './tables'
import { materializeEvents } from './materialize'
import { consumeSseStream, delay, eventsFromSseData } from './sse'

export type StoreListener = (tables: MaterializedTables) => void

export interface LoomsClientStoreOptions {
  /** Run id / LiveStore store id. */
  storeId: string
  /**
   * Base URL of the Looms host (e.g. http://127.0.0.1:8787).
   * Opens `${endpoint}/api/livestore?storeId=&live=true` as an SSE stream.
   */
  endpoint: string
  /** Backoff between SSE reconnects. Also accepted as `pollIntervalMs`. */
  reconnectDelayMs?: number
  /** @deprecated Use `reconnectDelayMs`. */
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

function eventSourceCtor(): typeof EventSource | undefined {
  if (typeof EventSource === 'undefined') return undefined
  return EventSource
}

/**
 * In-memory client store that follows a run's event log over SSE and
 * materializes generic `runs` / `threads` / `events_log` tables.
 */
export function createLoomsStore(options: LoomsClientStoreOptions): LoomsClientStore {
  const endpoint = options.endpoint.replace(/\/$/, '')
  const fetchFn = options.fetch ?? fetch
  const reconnectDelayMs = options.reconnectDelayMs ?? options.pollIntervalMs ?? 1_000
  const listeners = new Set<StoreListener>()
  const events: EventEnvelope[] = []
  const seenIds = new Set<string>()
  let tables = emptyTables()
  let fromSeq = 1
  let disposed = false
  let live = false
  let liveStarted = false
  let liveAbort: AbortController | undefined
  let eventSource: EventSource | undefined
  let syncing: Promise<void> | null = null

  const notify = () => {
    for (const listener of listeners) listener(tables)
  }

  const applyBatch = (batch: EventEnvelope[]) => {
    const fresh: EventEnvelope[] = []
    for (const event of batch) {
      if (event.seq < fromSeq || seenIds.has(event.id)) continue
      seenIds.add(event.id)
      fresh.push(event)
      fromSeq = Math.max(fromSeq, event.seq + 1)
    }
    if (fresh.length === 0) return
    tables = materializeEvents(fresh, tables)
    for (const event of fresh) events.push(event)
    notify()
  }

  const applyEncoded = (data: string) => {
    applyBatch(eventsFromSseData(data, options.storeId))
  }

  const liveUrl = () => {
    const cursor = Math.max(0, fromSeq - 1)
    return `${endpoint}/api/livestore?storeId=${encodeURIComponent(options.storeId)}&live=true&cursor=${cursor}`
  }

  const pull = async () => {
    const cursor = Math.max(0, fromSeq - 1)
    const url = `${endpoint}/api/livestore?storeId=${encodeURIComponent(options.storeId)}&cursor=${cursor}`
    const res = await fetchFn(url)
    if (!res.ok) {
      if (res.status === 404 || res.status === 416) return
      const text = await res.text()
      if (text.includes('out of range') || text.includes('Range not satisfiable')) return
      throw new Error(`livestore pull failed: ${res.status}`)
    }
    const body: unknown = await res.json()
    if (!Predicate.isReadonlyObject(body)) return
    const batch = 'batch' in body && Array.isArray(body.batch) ? body.batch : []
    applyBatch(
      batch.map((raw) =>
        decodeLoomsEvent(
          // SAFETY: host pull batch items are EventEnvelope | LiveStoreGlobalEncoded.
          raw as Parameters<typeof decodeLoomsEvent>[0],
          options.storeId,
        ),
      ),
    )
    const head = 'head' in body && Predicate.isNumber(body.head) ? body.head : undefined
    if (head !== undefined) fromSeq = Math.max(fromSeq, head + 1)
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

  const startEventSource = (Ctor: typeof EventSource) => {
    const es = new Ctor(liveUrl())
    eventSource = es
    es.addEventListener('open', () => {
      live = true
    })
    es.addEventListener('message', (msg) => {
      applyEncoded(msg.data)
    })
    es.addEventListener('error', () => {
      live = es.readyState === Ctor.OPEN
    })
  }

  const startFetchStream = async () => {
    while (true) {
      if (disposed) break
      const controller = new AbortController()
      liveAbort = controller
      try {
        const headers = new Headers({ accept: 'text/event-stream' })
        const cursor = Math.max(0, fromSeq - 1)
        if (cursor > 0) headers.set('last-event-id', String(cursor))
        const res = await fetchFn(liveUrl(), { headers, signal: controller.signal })
        if (!res.ok) throw new Error(`livestore sse failed: ${res.status}`)
        if (!res.body) throw new Error('livestore sse missing body')
        live = true
        await consumeSseStream(
          res.body,
          (frame) => {
            applyEncoded(frame.data)
          },
          controller.signal,
        )
      } catch {
        live = false
        if (disposed) return
      }
      live = false
      if (disposed) return
      await delay(reconnectDelayMs, controller.signal)
    }
  }

  const startLive = () => {
    if (liveStarted && !disposed) return
    liveStarted = true
    disposed = false
    const ctor = options.fetch === undefined ? eventSourceCtor() : undefined
    if (ctor) startEventSource(ctor)
    else void startFetchStream()
  }

  const stopLive = () => {
    liveStarted = false
    live = false
    eventSource?.close()
    eventSource = undefined
    liveAbort?.abort()
    liveAbort = undefined
  }

  startLive()

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
      if (disposed) startLive()
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
      if (!live) await sync()
    },
    dispose: () => {
      disposed = true
      stopLive()
      listeners.clear()
    },
  }

  return store
}
