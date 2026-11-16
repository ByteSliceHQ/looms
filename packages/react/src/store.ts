import { Data, DateTime, Effect, Fiber, Option, Predicate, Schema } from 'effect'

import { absoluteHttpBase, type SubscriptionSocketConstructor } from '@looms/client'
import {
  createEvent,
  createEventId,
  decodeLoomsEvent,
  readSubscriptionData,
  stringifyJson,
  type AnyEventEnvelope,
  type EventEnvelope,
  type EventInput,
  type ProjectionDefinition,
  type RegisteredEvent,
  type SubscriptionTransport,
} from '@looms/core'

import type { EventCache } from './cache'
import { EventIndex, ProjectionCache, type LiveFoldDefinition } from './derived'
import { materializeEvents } from './materialize'
import { createNotifyScheduler, type CoalesceOption } from './notify'
import type { StoreObservation, StoreObserver } from './observer'
import { consumeSseStreamEffect } from './sse'
import { emptyTables, type MaterializedTables } from './tables'

export type { CoalesceOption } from './notify'

/** Fired after the store version bumps. Re-read via `events()` / `getState()` / `query`. */
export type StoreListener = () => void

export type LoomsConnectionStatus = 'connecting' | 'live' | 'reconnecting'

/**
 * Sequence numbers at or above this belong to events the store is showing before the host has
 * confirmed them. They sort after every confirmed event.
 */
const PENDING_SEQ_BASE = 2 ** 52

/** How long a commit the host accepted may stay unconfirmed before the store stops showing it. */
const PENDING_SETTLE_MS = 10_000

/** True for an event shown optimistically that the host has not confirmed yet. */
export function isPendingEvent(event: { readonly seq: number }): boolean {
  return event.seq >= PENDING_SEQ_BASE
}

export interface CommitOptions {
  /**
   * Show the events at once, before the host confirms them. They are folded after every confirmed
   * event, replaced by the host's own copies when those arrive, and removed if the commit fails,
   * in which case `commit` rejects. Defaults to the store's `optimistic` option.
   */
  optimistic?: boolean
  /**
   * Identifies this commit to the host, which ignores a repeat of it. An optimistic commit is
   * matched to its confirmed events by this key; one is generated when it is left out.
   */
  idempotencyKey?: string
  /**
   * Sends the commit somewhere other than the run's signal route, such as a route of your own that
   * signs the events. It must signal the run with the `idempotencyKey` it is given, or an
   * optimistic commit cannot be matched to what the host records.
   */
  send?: (commit: {
    readonly events: readonly EventInput[]
    readonly idempotencyKey: string | undefined
    readonly signal: AbortSignal
  }) => Promise<void>
}

interface PendingCommit {
  readonly key: string
  readonly startedAt: number
  readonly events: readonly EventEnvelope[]
  settle: Fiber.Fiber<void> | undefined
}

/** How long a filtered subscription's opening replay must be quiet to count as caught up. */
const SYNC_QUIET_MS = 250

function nowMs(): number {
  return DateTime.toEpochMillis(DateTime.nowUnsafe())
}

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
   * Opens `${endpoint}/runs/:id/events?live=true` as an SSE stream.
   */
  endpoint: string
  /** Backoff between reconnects. The delay stays fixed, matching the SSE client. */
  reconnectDelayMs?: number
  fetch?: typeof fetch
  coalesce?: CoalesceOption
  /**
   * `undefined` keeps the current SSE path. `websocket` and `auto` use a hibernating
   * socket when a constructor is available.
   */
  transport?: SubscriptionTransport
  threadId?: string
  includeEphemeral?: boolean
  webSocket?: SubscriptionSocketConstructor
  /**
   * First sequence number to follow. Use it with state you already hold up to `fromSeq - 1`, such
   * as a projection the host served, so the store does not download the log behind it. Events
   * before it are never seen: `events()`, projections and the run summary cover only what follows.
   */
  fromSeq?: number
  /** Whether `commit` shows its events before the host confirms them. Defaults to false. */
  optimistic?: boolean
  /**
   * Keeps the run's durable events on the device. A store that has followed the run before starts
   * from them and downloads only what was appended since. Not used together with `fromSeq`.
   */
  cache?: EventCache
  /** Told how long the run took to show and how long each commit took. */
  observer?: StoreObserver
}

export interface LoomsStoreQuery<TEvent extends AnyEventEnvelope = RegisteredEvent> {
  events: (options?: { threadId?: string }) => readonly TEvent[]
  runs: () => MaterializedTables['runs']
  threads: () => MaterializedTables['threads']
  counts: () => ReadonlyMap<string, number>
  bySeq: (seq: number) => TEvent | undefined
  startedAt: () => number | undefined
  latest: (type: string) => TEvent | undefined
  fold: <S>(def: LiveFoldDefinition<S, TEvent>) => S
}

export interface LoomsClientStore<TEvent extends AnyEventEnvelope = RegisteredEvent> {
  storeId: string
  version: () => number
  status: () => LoomsConnectionStatus
  /**
   * True once the store holds everything the log had when the subscription opened. Until then an
   * empty projection means "still loading", not "nothing there".
   */
  synced: () => boolean
  getState: () => MaterializedTables
  events: (options?: { threadId?: string }) => readonly TEvent[]
  query: LoomsStoreQuery<TEvent>
  subscribe: (listener: StoreListener) => () => void
  project<S>(definition: ProjectionDefinition<S>): S
  fold<S>(definition: LiveFoldDefinition<S, TEvent>): S
  flush: () => void
  /** Events shown optimistically that the host has not confirmed yet. */
  pending: () => readonly TEvent[]
  commit: (event: EventInput | readonly EventInput[], options?: CommitOptions) => Promise<void>
  sync: () => Promise<void>
  dispose: () => void
}

function socketConstructor(
  options: LoomsClientStoreOptions,
): SubscriptionSocketConstructor | undefined {
  if (options.transport !== 'websocket' && options.transport !== 'auto') {
    return undefined
  }

  if (options.webSocket) {
    return options.webSocket
  }

  if (!('WebSocket' in globalThis) || !Predicate.isFunction(globalThis.WebSocket)) {
    return undefined
  }

  return globalThis.WebSocket
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
  const createdAt = nowMs()

  const observe = (observation: StoreObservation) => {
    try {
      options.observer?.observe(observation)
    } catch {
      // An observer must never break the store it watches.
    }
  }

  // The cache holds a whole view of the run, so a store that starts partway through has none.
  const cache = options.fromSeq === undefined || options.fromSeq <= 1 ? options.cache : undefined
  const cacheKey = [endpoint, options.storeId, options.threadId ?? ''].join('|')
  let cacheWrites: Promise<void> = Promise.resolve()
  let cachedEvents = 0
  let hydrated = cache === undefined
  let hydrating: Promise<void> | undefined

  let eventsSnapshot: readonly RegisteredEvent[] = Object.freeze([])
  let eventsSnapshotDirty = false
  let version = 0
  let status: LoomsConnectionStatus = 'connecting'
  let tables = emptyTables()
  let fromSeq = Math.max(1, Math.trunc(options.fromSeq ?? 1))
  // A filtered subscription may never be sent the event at the tail, so it also counts as caught
  // up once the opening replay goes quiet.
  const filtered = options.threadId !== undefined || options.includeEphemeral === false
  let synced = false
  let syncTail: number | undefined
  let quietFiber: Fiber.Fiber<void> | undefined
  let disposed = false
  let live = false
  let liveStarted = false
  let liveAbort: AbortController | undefined
  let eventSource: EventSource | undefined
  let socket: { close(code?: number, reason?: string): void } | undefined
  let reconnectFiber: Fiber.Fiber<void> | undefined
  let syncing: Promise<void> | null = null

  const pendingCommits: PendingCommit[] = []
  let pendingEvents: readonly RegisteredEvent[] = Object.freeze([])
  let pendingVersion = 0
  let pendingSeq = PENDING_SEQ_BASE
  interface VisibleEvents {
    readonly base: readonly RegisteredEvent[]
    readonly pending: number
    readonly value: readonly RegisteredEvent[]
  }

  let visible: VisibleEvents | undefined
  const visibleByThread = new Map<string, VisibleEvents>()

  const confirmedEvents = (): readonly RegisteredEvent[] => {
    if (!eventsSnapshotDirty) {
      return eventsSnapshot
    }

    eventsSnapshot = Object.freeze(events.slice())
    eventsSnapshotDirty = false
    return eventsSnapshot
  }

  /** `base` with the pending events after it. Stable while neither has changed. */
  const withPending = (
    base: readonly RegisteredEvent[],
    cached: VisibleEvents | undefined,
    threadId?: string,
  ): VisibleEvents => {
    if (cached && cached.base === base && cached.pending === pendingVersion) {
      return cached
    }

    const extra = threadId
      ? pendingEvents.filter((event) => event.threadId === threadId)
      : pendingEvents

    return {
      base,
      pending: pendingVersion,
      value: extra.length === 0 ? base : Object.freeze([...base, ...extra]),
    }
  }

  /** What readers see: every confirmed event, then the ones still waiting to be confirmed. */
  const publishedEvents = (): readonly RegisteredEvent[] => {
    visible = withPending(confirmedEvents(), visible)
    return visible.value
  }

  const setPending = () => {
    pendingEvents = Object.freeze(pendingCommits.flatMap((commit) => commit.events))
    pendingVersion += 1
    version += 1
  }

  const dropPending = (commit: PendingCommit, confirmed = false): boolean => {
    const index = pendingCommits.indexOf(commit)

    if (index === -1) {
      return false
    }

    if (confirmed) {
      const at = nowMs()

      observe({
        type: 'commit.confirmed',
        runId: options.storeId,
        at,
        durationMs: at - commit.startedAt,
      })
    }

    pendingCommits.splice(index, 1)

    if (commit.settle !== undefined) {
      Effect.runFork(Fiber.interrupt(commit.settle))
      commit.settle = undefined
    }

    setPending()
    return true
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
    observe({ type: 'store.connection', runId: options.storeId, at: nowMs(), status: next })
    version += 1
    notify.schedule()
  }

  const cancelQuiet = () => {
    if (quietFiber !== undefined) {
      Effect.runFork(Fiber.interrupt(quietFiber))
      quietFiber = undefined
    }
  }

  const markSynced = () => {
    cancelQuiet()

    if (synced) {
      return
    }

    synced = true

    const at = nowMs()

    observe({
      type: 'store.synced',
      runId: options.storeId,
      at,
      durationMs: at - createdAt,
      eventCount: events.length,
      cachedEvents,
    })

    version += 1
    notify.schedule()
  }

  /** Called when the subscription reports its bounds and after each batch that follows. */
  const checkSynced = () => {
    if (synced || syncTail === undefined) {
      return
    }

    if (fromSeq > syncTail) {
      markSynced()
      return
    }

    if (filtered) {
      cancelQuiet()

      quietFiber = Effect.runFork(
        Effect.sleep(SYNC_QUIET_MS).pipe(Effect.andThen(Effect.sync(markSynced))),
      )
    }
  }

  const applyBatch = (batch: EventEnvelope[], fromCache = false) => {
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
      checkSynced()
      return
    }

    tables = materializeEvents(fresh, tables)

    for (const event of fresh) {
      events.push(event)
    }

    eventsSnapshotDirty = true
    eventIndex.append(fresh)
    version += 1

    // The host's copy of an optimistic commit takes the place of the provisional one.
    for (const event of fresh) {
      const confirmed = event.idempotencyKey
        ? pendingCommits.find((commit) => commit.key === event.idempotencyKey)
        : undefined

      if (confirmed) {
        dropPending(confirmed, true)
      }
    }

    if (cache && !fromCache) {
      const durable = fresh.filter((event) => !event.ephemeral)

      if (durable.length > 0) {
        cacheWrites = cacheWrites.then(() => cache.append(cacheKey, durable)).catch(() => undefined)
      }
    }

    notify.schedule()
    checkSynced()
  }

  /** Drops everything the store holds, when what the cache supplied is not the host's log. */
  const forgetCache = () => {
    events.length = 0
    seenIds.clear()
    eventIndex.clear()
    projectionCache.clear()
    tables = emptyTables()
    eventsSnapshotDirty = true
    cachedEvents = 0
    synced = false
    syncTail = undefined
    version += 1

    if (cache) {
      cacheWrites = cacheWrites.then(() => cache.clear(cacheKey)).catch(() => undefined)
    }

    notify.schedule()
  }

  const applyLiveData = (data: string): 'continue' | 'resync' => {
    const read = readSubscriptionData(data, options.storeId)

    switch (read.kind) {
      case 'events':
        applyBatch(read.events.slice())
        return 'continue'
      case 'resync':
        fromSeq = read.head
        return 'resync'
      case 'hello':
        // The cache is ahead of the host's log, so it was kept from a different one.
        if (cachedEvents > 0 && read.tail < fromSeq - 1) {
          forgetCache()
          fromSeq = 1
          return 'resync'
        }

        syncTail = read.tail
        checkSynced()
        return 'continue'
      case 'ignore':
        return 'continue'

      default: {
        const unexpected: never = read
        return unexpected
      }
    }
  }

  const liveUrl = () => {
    const params = new URLSearchParams({ live: 'true', fromSeq: String(fromSeq) })

    if (options.threadId) {
      params.set('threadId', options.threadId)
    }

    if (options.includeEphemeral === false) {
      params.set('includeEphemeral', 'false')
    }

    return `${endpoint}/runs/${encodeURIComponent(options.storeId)}/events?${params.toString()}`
  }

  const pull = Effect.gen(function* () {
    const url = `${endpoint}/runs/${encodeURIComponent(options.storeId)}/events?fromSeq=${fromSeq}`

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
    const pulledEvents = 'events' in body && Array.isArray(body.events) ? body.events : []

    applyBatch(pulledEvents.map((raw) => decodeLoomsEvent(raw, options.storeId)))
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

  const scheduleReconnect = (start: () => void) => {
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
          start()
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
      if (applyLiveData(msg.data) === 'resync') {
        es.close()

        if (eventSource === es) {
          eventSource = undefined
        }

        setStatus('reconnecting')

        scheduleReconnect(() => {
          startEventSource(Ctor)
        })
      }
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

        scheduleReconnect(() => {
          startEventSource(Ctor)
        })
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

          return yield* consumeSseStreamEffect(body, (frame) =>
            applyLiveData(frame.data) === 'resync' ? false : undefined,
          )
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

  const startWebSocket = (Ctor: SubscriptionSocketConstructor) => {
    if (disposed || !liveStarted) {
      return
    }

    let url: string

    try {
      const http = new URL(liveUrl(), absoluteHttpBase(endpoint))
      http.protocol = http.protocol === 'https:' ? 'wss:' : 'ws:'
      url = http.toString()
    } catch {
      startFetchStream()
      return
    }

    const ws = new Ctor(url)
    socket = ws

    ws.addEventListener('open', () => {
      live = true
      setStatus('live')
    })

    ws.addEventListener('message', (event) => {
      if (!Predicate.isString(event.data)) {
        return
      }

      if (applyLiveData(event.data) === 'resync') {
        ws.close()
      }
    })

    ws.addEventListener('close', () => {
      live = false

      if (socket === ws) {
        socket = undefined
      }

      if (!disposed && liveStarted) {
        setStatus('reconnecting')

        scheduleReconnect(() => {
          startWebSocket(Ctor)
        })
      }
    })
  }

  const startLive = () => {
    if (!options.storeId || (liveStarted && !disposed)) {
      return
    }

    liveStarted = true
    disposed = false
    const socketCtor = socketConstructor(options)

    if (socketCtor) {
      startWebSocket(socketCtor)
      return
    }

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
    socket?.close()
    socket = undefined
    liveAbort?.abort()
    liveAbort = undefined
  }

  /** Starts following the run, after first loading whatever the device kept of it. */
  const begin = () => {
    if (hydrated || !cache) {
      startLive()
      return
    }

    hydrating ??= cache
      .load(cacheKey)
      .then((kept) => {
        if (disposed || events.length > 0) {
          return
        }

        applyBatch(kept.slice(), true)
        cachedEvents = events.length
      })
      .catch(() => undefined)
      .then(() => {
        hydrated = true
        hydrating = undefined

        if (!disposed) {
          startLive()
        }
      })
  }

  if (options.storeId) {
    begin()
  }

  const readEvents = (filterOptions?: { threadId?: string }): readonly RegisteredEvent[] => {
    const threadId = filterOptions?.threadId

    if (threadId) {
      const slice = withPending(
        eventIndex.getByThread(threadId),
        visibleByThread.get(threadId),
        threadId,
      )

      visibleByThread.set(threadId, slice)
      return slice.value
    }

    return publishedEvents()
  }

  const store: LoomsClientStore = {
    storeId: options.storeId,
    version: () => version,
    status: () => status,
    synced: () => synced,
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
      fold: <S>(def: LiveFoldDefinition<S>) =>
        projectionCache.fold(def, confirmedEvents(), pendingEvents, pendingVersion),
    },
    subscribe: (listener) => {
      listeners.add(listener)
      listener()

      if (disposed) {
        begin()
      }

      return () => {
        listeners.delete(listener)
      }
    },
    project: (definition) =>
      projectionCache.project(definition, confirmedEvents(), pendingEvents, pendingVersion),
    fold: (definition) =>
      projectionCache.fold(definition, confirmedEvents(), pendingEvents, pendingVersion),
    pending: () => pendingEvents,
    flush: notify.flush,
    sync: () =>
      sync().then(() => {
        notify.flush()
      }),
    commit: (event, commitOptions) => {
      const inputs: readonly EventInput[] = Array.isArray(event) ? event : [event]
      const optimistic = commitOptions?.optimistic ?? options.optimistic ?? false

      const key = commitOptions?.idempotencyKey ?? (optimistic ? createEventId() : undefined)

      const startedAt = nowMs()
      let shown: PendingCommit | undefined

      if (optimistic && key !== undefined && inputs.length > 0) {
        const rootThreadId = tables.runs.get(options.storeId)?.rootThreadId ?? null

        shown = {
          key,
          startedAt,
          settle: undefined,
          events: inputs.map((input) => {
            pendingSeq += 1

            return createEvent(
              options.storeId,
              {
                ...input,
                threadId: input.threadId === undefined ? rootThreadId : input.threadId,
                origin: input.origin ?? { type: 'external' },
                idempotencyKey: input.idempotencyKey ?? key,
              },
              { seq: pendingSeq },
            )
          }),
        }

        pendingCommits.push(shown)
        setPending()
        notify.schedule()
        notify.flush()
      }

      const post = (signal: AbortSignal): Promise<void> => {
        if (commitOptions?.send) {
          return commitOptions.send({ events: inputs, idempotencyKey: key, signal })
        }

        const body =
          key === undefined
            ? Array.isArray(event)
              ? { events: inputs }
              : event
            : { events: inputs, idempotencyKey: key }

        // The log is what the UI renders, so the answer is wanted as soon as the events are
        // committed, not once the run has finished acting on them.
        return fetchFn(
          `${endpoint}/runs/${encodeURIComponent(options.storeId)}/events?respond=async`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: stringifyJson(body),
            signal,
          },
        ).then((res) =>
          res.ok
            ? undefined
            : res.text().then((text) => {
                throw new LoomsStoreError(`Run signal failed: ${res.status} ${text}`)
              }),
        )
      }

      return Effect.runPromise(
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: post,
            catch: (cause) =>
              cause instanceof LoomsStoreError
                ? cause
                : new LoomsStoreError('Run signal failed', cause),
          })

          if (!live) {
            yield* Effect.promise(sync)
          }

          return undefined
        }).pipe(
          Effect.tapError((error) =>
            Effect.sync(() => {
              const at = nowMs()

              observe({
                type: 'commit.failed',
                runId: options.storeId,
                at,
                durationMs: at - startedAt,
                message: error.message,
              })

              // Roll back: the events were never recorded.
              if (shown && dropPending(shown)) {
                notify.schedule()
                notify.flush()
              }
            }),
          ),
        ),
      ).then(() => {
        const at = nowMs()

        observe({
          type: 'commit.acked',
          runId: options.storeId,
          at,
          durationMs: at - startedAt,
          eventCount: inputs.length,
          optimistic: shown !== undefined,
        })

        const accepted = shown

        if (accepted && pendingCommits.includes(accepted)) {
          // The host took the commit, so its events are on their way. If none ever carries this
          // key (the host recorded something else, or nothing), stop showing ours.
          accepted.settle = Effect.runFork(
            Effect.sleep(PENDING_SETTLE_MS).pipe(
              Effect.andThen(Effect.promise(sync)),
              Effect.andThen(
                Effect.sync(() => {
                  accepted.settle = undefined

                  if (dropPending(accepted)) {
                    notify.schedule()
                  }
                }),
              ),
            ),
          )
        }

        notify.flush()
      })
    },
    dispose: () => {
      disposed = true
      cancelQuiet()

      for (const commit of pendingCommits.splice(0)) {
        if (commit.settle !== undefined) {
          Effect.runFork(Fiber.interrupt(commit.settle))
        }
      }

      pendingEvents = Object.freeze([])
      visibleByThread.clear()
      notify.cancel()
      stopLive()
      listeners.clear()
      projectionCache.clear()
      eventIndex.clear()
    },
  }

  return store
}
