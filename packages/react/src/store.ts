import { Predicate } from 'effect'

import {
  decodeLoomsEvent,
  type EventEnvelope,
  type EventInput,
  type ProjectionDefinition,
} from '@looms/core'

import { EventIndex, ProjectionCache, type EventFoldDefinition } from './derived'
import { materializeEvents } from './materialize'
import { createNotifyScheduler, type CoalesceOption } from './notify'
import type { AnyEventEnvelope, RegisteredEvent } from './register'
import { consumeSseStream, delay, eventsFromSseData } from './sse'
import { emptyTables, type MaterializedTables } from './tables'

export type { CoalesceOption } from './notify'

/** Fired after the store version bumps. Re-read via `events()` / `getState()` / `query`. */
export type StoreListener = () => void

export type LoomsConnectionStatus = 'connecting' | 'live' | 'reconnecting'

export interface LoomsClientStoreOptions {
  /** Run id for this client store. */
  storeId: string
  /**
   * Base URL of the Looms host (e.g. http://127.0.0.1:8787).
   * Opens `${endpoint}/api/events?runId=&live=true` as an SSE stream.
   */
  endpoint: string
  /** Backoff between SSE reconnects. */
  reconnectDelayMs?: number
  fetch?: typeof fetch
  coalesce?: CoalesceOption
}

export interface LoomsStoreQuery<TEvent extends AnyEventEnvelope = RegisteredEvent> {
  events: (options?: { threadId?: string }) => readonly TEvent[]
  runs: () => MaterializedTables['runs']
  threads: () => MaterializedTables['threads']
  counts: () => ReadonlyMap<string, number>
  bySeq: (seq: number) => TEvent | undefined
  startedAt: () => number | undefined
  latest: (type: string) => TEvent | undefined
  fold: <S>(def: EventFoldDefinition<S, TEvent>) => S
}

export interface LoomsClientStore<TEvent extends AnyEventEnvelope = RegisteredEvent> {
  storeId: string
  version: () => number
  status: () => LoomsConnectionStatus
  getState: () => MaterializedTables
  events: (options?: { threadId?: string }) => readonly TEvent[]
  query: LoomsStoreQuery<TEvent>
  subscribe: (listener: StoreListener) => () => void
  project<S>(definition: ProjectionDefinition<S>): S
  fold<S>(definition: EventFoldDefinition<S, TEvent>): S
  flush: () => void
  commit: (event: EventInput) => Promise<void>
  sync: () => Promise<void>
  dispose: () => void
}

function eventSourceCtor(): typeof EventSource | undefined {
  if (typeof EventSource === 'undefined') {
    return undefined
  }

  return EventSource
}

/**
 * In-memory client store that follows a run's event log over SSE and
 * materializes generic `runs` / `threads` tables.
 */
export function createLoomsStore<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  options: LoomsClientStoreOptions,
): LoomsClientStore<TEvent> {
  const endpoint = options.endpoint.replace(/\/$/, '')
  const fetchFn = options.fetch ?? fetch
  const reconnectDelayMs = options.reconnectDelayMs ?? 1_000
  const coalesce = options.coalesce ?? 'adaptive'
  const listeners = new Set<StoreListener>()
  const events: EventEnvelope[] = []
  const seenIds = new Set<string>()
  const projectionCache = new ProjectionCache()
  const eventIndex = new EventIndex<TEvent>()

  let eventsSnapshot: readonly TEvent[] = Object.freeze([])
  let eventsSnapshotDirty = false
  let version = 0
  let status: LoomsConnectionStatus = 'connecting'
  let tables = emptyTables()
  let fromSeq = 1
  let disposed = false
  let live = false
  let liveStarted = false
  let liveAbort: AbortController | undefined
  let eventSource: EventSource | undefined
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let syncing: Promise<void> | null = null

  const publishedEvents = (): readonly TEvent[] => {
    if (!eventsSnapshotDirty) {
      return eventsSnapshot
    }

    // SAFETY: events array only contains TEvent values pushed from applyBatch.
    eventsSnapshot = Object.freeze(events.slice() as TEvent[])
    eventsSnapshotDirty = false
    return eventsSnapshot
  }

  const notify = createNotifyScheduler(coalesce, () => {
    publishedEvents()

    for (const listener of listeners) {
      listener()
    }
  })

  const setStatus = (next: LoomsConnectionStatus) => {
    if (status === next) {
      return
    }

    status = next
    version += 1
    notify.schedule()
  }

  const applyBatch = (batch: EventEnvelope[]) => {
    const fresh: TEvent[] = []

    for (const event of batch) {
      if (event.seq < fromSeq || seenIds.has(event.id)) {
        continue
      }

      seenIds.add(event.id)
      // SAFETY: wire events match the app-registered TEvent catalog at the type boundary.
      fresh.push(event as TEvent)
      fromSeq = Math.max(fromSeq, event.seq + 1)
    }

    if (fresh.length === 0) {
      return
    }

    tables = materializeEvents(fresh, tables)

    for (const event of fresh) {
      events.push(event)
    }

    eventsSnapshotDirty = true
    eventIndex.append(fresh)
    version += 1

    notify.schedule()
  }

  const applyEncoded = (data: string) => {
    applyBatch(eventsFromSseData(data, options.storeId))
  }

  const liveUrl = () => {
    const cursor = Math.max(0, fromSeq - 1)
    return `${endpoint}/api/events?runId=${encodeURIComponent(options.storeId)}&live=true&cursor=${cursor}`
  }

  const pull = async () => {
    try {
      const cursor = Math.max(0, fromSeq - 1)
      const url = `${endpoint}/api/events?runId=${encodeURIComponent(options.storeId)}&cursor=${cursor}`
      const res = await fetchFn(url)

      if (!res.ok) {
        if (res.status === 404 || res.status === 416) {
          return
        }

        const text = await res.text()

        if (text.includes('out of range') || text.includes('Range not satisfiable')) {
          return
        }

        throw new Error(`event pull failed: ${res.status}`)
      }

      const body: unknown = await res.json()

      if (!Predicate.isReadonlyObject(body)) {
        return
      }

      const batch = 'batch' in body && Array.isArray(body.batch) ? body.batch : []

      applyBatch(
        batch.map((raw) =>
          decodeLoomsEvent(
            // SAFETY: host pull batch items are encoded Looms event envelopes.
            raw as Parameters<typeof decodeLoomsEvent>[0],
            options.storeId,
          ),
        ),
      )

      const head = 'head' in body && Predicate.isNumber(body.head) ? body.head : undefined

      if (head !== undefined) {
        fromSeq = Math.max(fromSeq, head + 1)
      }
    } catch (err) {
      if (disposed) {
        return
      }

      // When offline or host is restarting, suppress connection refused/fetch errors during sync
      if (
        err instanceof Error &&
        (err.message.includes('fetch failed') ||
          err.message.includes('ConnectionRefused') ||
          err.message.includes('Unable to connect'))
      ) {
        return
      }

      throw err
    }
  }

  const sync = async () => {
    if (disposed) {
      return
    }

    if (syncing) {
      return syncing
    }

    syncing = (async () => {
      try {
        await pull()
      } finally {
        syncing = null
      }
    })()

    return syncing
  }

  const scheduleReconnect = (Ctor: typeof EventSource) => {
    if (disposed || !liveStarted || reconnectTimer !== undefined) {
      return
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined

      if (disposed || !liveStarted) {
        return
      }

      void sync()
        .catch(() => {})
        .finally(() => {
          if (!disposed && liveStarted) {
            startEventSource(Ctor)
          }
        })
    }, reconnectDelayMs)
  }

  const startEventSource = (Ctor: typeof EventSource) => {
    if (disposed || !liveStarted) {
      return
    }

    const es = new Ctor(liveUrl())
    eventSource = es

    es.addEventListener('open', () => {
      live = true
      setStatus('live')
    })

    es.addEventListener('message', (msg) => {
      applyEncoded(msg.data)
    })

    es.addEventListener('error', () => {
      live = es.readyState === Ctor.OPEN

      if (es.readyState === Ctor.CLOSED && !disposed && liveStarted) {
        setStatus('reconnecting')
        // EventSource entered CLOSED state (e.g. server error or socket closed abruptly).
        // Standard EventSource will NOT automatically reconnect on CLOSED, so we must
        // clean up the dead instance and re-establish the connection.
        es.close()

        if (eventSource === es) {
          eventSource = undefined
        }

        scheduleReconnect(Ctor)
      } else if (!live) {
        setStatus('reconnecting')
      }
    })
  }

  const startFetchStream = async () => {
    while (true) {
      if (disposed) {
        break
      }

      const controller = new AbortController()
      liveAbort = controller

      try {
        const headers = new Headers({ accept: 'text/event-stream' })
        const cursor = Math.max(0, fromSeq - 1)

        if (cursor > 0) {
          headers.set('last-event-id', String(cursor))
        }

        const res = await fetchFn(liveUrl(), { headers, signal: controller.signal })

        if (!res.ok) {
          throw new Error(`event stream failed: ${res.status}`)
        }

        if (!res.body) {
          throw new Error('event stream missing body')
        }

        live = true
        setStatus('live')

        await consumeSseStream(
          res.body,
          (frame) => {
            applyEncoded(frame.data)
          },
          controller.signal,
        )
      } catch {
        live = false

        if (disposed) {
          return
        }

        setStatus('reconnecting')
      }

      live = false

      if (disposed) {
        return
      }

      await delay(reconnectDelayMs, controller.signal)
    }
  }

  const startLive = () => {
    if (!options.storeId || (liveStarted && !disposed)) {
      return
    }

    liveStarted = true
    disposed = false
    const ctor = options.fetch === undefined ? eventSourceCtor() : undefined

    if (ctor) {
      startEventSource(ctor)
    } else {
      void startFetchStream()
    }
  }

  const stopLive = () => {
    liveStarted = false
    live = false

    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }

    eventSource?.close()
    eventSource = undefined
    liveAbort?.abort()
    liveAbort = undefined
  }

  if (options.storeId) {
    startLive()
  }

  const readEvents = (filterOptions?: { threadId?: string }): readonly TEvent[] => {
    if (filterOptions?.threadId) {
      return eventIndex.getByThread(filterOptions.threadId)
    }

    return publishedEvents()
  }

  const store: LoomsClientStore<TEvent> = {
    storeId: options.storeId,
    version: () => version,
    status: () => status,
    /**
     * Live mutable materialized tables. Re-read after each version bump;
     * do not hold Map/array references across notifies.
     */
    getState: () => tables,
    events: readEvents,
    query: {
      events: readEvents,
      runs: () => tables.runs,
      threads: () => tables.threads,
      counts: () => eventIndex.getCounts(),
      bySeq: (seq: number) => eventIndex.getBySeq(seq),
      startedAt: () => eventIndex.getStartedAt(),
      latest: (type: string) => eventIndex.getLatest(type),
      fold: <S>(def: EventFoldDefinition<S, TEvent>) =>
        projectionCache.fold(def, publishedEvents()),
    },
    subscribe: (listener) => {
      listeners.add(listener)
      listener()

      if (disposed) {
        startLive()
      }

      return () => {
        listeners.delete(listener)
      }
    },
    project: (definition) => projectionCache.project(definition, publishedEvents()),
    fold: (definition) => projectionCache.fold(definition, publishedEvents()),
    flush: notify.flush,
    sync: async () => {
      const res = await sync()
      notify.flush()
      return res
    },
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

      if (!live) {
        await sync()
      }

      notify.flush()
    },
    dispose: () => {
      disposed = true
      notify.cancel()
      stopLive()
      listeners.clear()
      projectionCache.clear()
      eventIndex.clear()
    },
  }

  return store
}
