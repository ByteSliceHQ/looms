import { Data, Effect, Fiber, Option, Predicate, Schema } from 'effect'

import {
  decodeLoomsEvent,
  stringifyJson,
  type EventEnvelope,
  type EventInput,
  type ProjectionDefinition,
} from '@looms/core'

import { EventIndex, ProjectionCache, type EventFoldDefinition } from './derived'
import { materializeEvents } from './materialize'
import { createNotifyScheduler, type CoalesceOption } from './notify'
import type { AnyEventEnvelope, RegisteredEvent } from './register'
import { consumeSseStreamEffect, eventsFromSseData } from './sse'
import { emptyTables, type MaterializedTables } from './tables'

export type { CoalesceOption } from './notify'

/** Fired after the store version bumps. Re-read via `events()` / `getState()` / `query`. */
export type StoreListener = () => void

export type LoomsConnectionStatus = 'connecting' | 'live' | 'reconnecting'

class LoomsStoreError extends Data.TaggedError('LoomsStoreError')<{
  readonly cause?: unknown
  readonly message: string
}> {
  constructor(message: string, cause?: unknown) {
    super({ cause, message })
    this.name = 'LoomsStoreError'
  }
}

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
export function createLoomsStore(options: LoomsClientStoreOptions): LoomsClientStore {
  const endpoint = options.endpoint.replace(/\/$/, '')
  const fetchFn = options.fetch ?? fetch
  const reconnectDelayMs = options.reconnectDelayMs ?? 1_000
  const coalesce = options.coalesce ?? 'adaptive'
  const listeners = new Set<StoreListener>()
  const events: EventEnvelope[] = []
  const seenIds = new Set<string>()
  const projectionCache = new ProjectionCache()
  const eventIndex = new EventIndex()

  let eventsSnapshot: readonly RegisteredEvent[] = Object.freeze([])
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
  let reconnectFiber: Fiber.Fiber<void> | undefined
  let syncing: Promise<void> | null = null

  const publishedEvents = (): readonly RegisteredEvent[] => {
    if (!eventsSnapshotDirty) {
      return eventsSnapshot
    }

    eventsSnapshot = Object.freeze(events.slice())
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
    const fresh: RegisteredEvent[] = []

    for (const event of batch) {
      if (event.seq < fromSeq || seenIds.has(event.id)) {
        continue
      }

      seenIds.add(event.id)
      fresh.push(event)
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

  const pull = Effect.gen(function* () {
    const cursor = Math.max(0, fromSeq - 1)
    const url = `${endpoint}/api/events?runId=${encodeURIComponent(options.storeId)}&cursor=${cursor}`

    const res = yield* Effect.tryPromise({
      try: (signal) => fetchFn(url, { signal }),
      catch: (cause) => new LoomsStoreError('Event pull failed', cause),
    })

    if (!res.ok) {
      if (res.status === 404 || res.status === 416) {
        return undefined
      }

      const text = yield* Effect.promise(() => res.text())

      if (text.includes('out of range') || text.includes('Range not satisfiable')) {
        return undefined
      }

      return yield* new LoomsStoreError(`Event pull failed: ${res.status}`)
    }

    const rawBody = yield* Effect.promise(() => res.json())
    const decodedBody = Schema.decodeUnknownOption(Schema.Json)(rawBody)

    if (Option.isNone(decodedBody) || !Predicate.isReadonlyObject(decodedBody.value)) {
      return undefined
    }

    const body = decodedBody.value
    const batch = 'batch' in body && Array.isArray(body.batch) ? body.batch : []

    applyBatch(batch.map((raw) => decodeLoomsEvent(raw, options.storeId)))

    const head = 'head' in body && Predicate.isNumber(body.head) ? body.head : undefined

    if (head !== undefined) {
      fromSeq = Math.max(fromSeq, head + 1)
    }

    return undefined
  }).pipe(
    Effect.catchIf(
      (error) =>
        disposed ||
        error.message.includes('fetch failed') ||
        error.message.includes('ConnectionRefused') ||
        error.message.includes('Unable to connect'),
      () => Effect.void,
    ),
  )

  const sync = () => {
    if (disposed) {
      return Promise.resolve()
    }

    if (syncing) {
      return syncing
    }

    syncing = Effect.runPromise(pull).finally(() => {
      syncing = null
    })

    return syncing
  }

  const scheduleReconnect = (Ctor: typeof EventSource) => {
    if (disposed || !liveStarted || reconnectFiber !== undefined) {
      return
    }

    reconnectFiber = Effect.runFork(
      Effect.gen(function* () {
        yield* Effect.sleep(reconnectDelayMs)
        reconnectFiber = undefined

        if (disposed || !liveStarted) {
          return
        }

        yield* Effect.tryPromise({
          try: sync,
          catch: (cause) => new LoomsStoreError('Event resync failed', cause),
        }).pipe(Effect.ignore)

        if (!disposed && liveStarted) {
          startEventSource(Ctor)
        }
      }),
    )
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

  const startFetchStream = () => {
    const controller = new AbortController()
    liveAbort = controller

    const run = Effect.gen(function* () {
      while (true) {
        if (disposed) {
          return
        }

        yield* Effect.gen(function* () {
          const headers = new Headers({ accept: 'text/event-stream' })
          const cursor = Math.max(0, fromSeq - 1)

          if (cursor > 0) {
            headers.set('last-event-id', String(cursor))
          }

          const res = yield* Effect.tryPromise({
            try: (signal) => fetchFn(liveUrl(), { headers, signal }),
            catch: (cause) => new LoomsStoreError('Event stream failed', cause),
          })

          const body = res.body

          if (!res.ok || !body) {
            return yield* new LoomsStoreError(
              res.ok ? 'Event stream missing body' : `Event stream failed: ${res.status}`,
            )
          }

          live = true
          setStatus('live')

          return yield* consumeSseStreamEffect(body, (frame) => {
            applyEncoded(frame.data)
          })
        }).pipe(
          Effect.catch(() =>
            Effect.sync(() => {
              live = false

              if (!disposed) {
                setStatus('reconnecting')
              }
            }),
          ),
        )

        live = false

        if (!disposed) {
          yield* Effect.sleep(reconnectDelayMs)
        }
      }
    })

    void Effect.runPromise(run, { signal: controller.signal }).catch(() => undefined)
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
      startFetchStream()
    }
  }

  const stopLive = () => {
    liveStarted = false
    live = false

    if (reconnectFiber !== undefined) {
      Effect.runFork(Fiber.interrupt(reconnectFiber))
      reconnectFiber = undefined
    }

    eventSource?.close()
    eventSource = undefined
    liveAbort?.abort()
    liveAbort = undefined
  }

  if (options.storeId) {
    startLive()
  }

  const readEvents = (filterOptions?: { threadId?: string }): readonly RegisteredEvent[] => {
    if (filterOptions?.threadId) {
      return eventIndex.getByThread(filterOptions.threadId)
    }

    return publishedEvents()
  }

  const store: LoomsClientStore = {
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
      fold: <S>(def: EventFoldDefinition<S>) => projectionCache.fold(def, publishedEvents()),
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
    sync: () =>
      sync().then(() => {
        notify.flush()
      }),
    commit: (event) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const res = yield* Effect.tryPromise({
            try: (signal) =>
              fetchFn(`${endpoint}/runs/${encodeURIComponent(options.storeId)}/events`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: stringifyJson(event),
                signal,
              }),
            catch: (cause) => new LoomsStoreError('Run signal failed', cause),
          })

          if (!res.ok) {
            const text = yield* Effect.promise(() => res.text())
            return yield* new LoomsStoreError(`Run signal failed: ${res.status} ${text}`)
          }

          if (!live) {
            yield* Effect.promise(sync)
          }

          notify.flush()
          return undefined
        }),
      ),
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
