import { Effect, Fiber } from 'effect'
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import type { SubscriptionSocketConstructor } from '@looms/client'
import {
  isTerminalStatus,
  sameStringRecord,
  threadTree,
  toThreadTree,
  type AnyEventEnvelope,
  type LoomsIds,
  type ProjectionDefinition,
  type RegisteredEvent,
  type RunAttributes,
  type RunLaunchSource,
  type RunStatus,
  type SubscriptionTransport,
  type ThreadTree,
} from '@looms/core'

import type { EventCache } from './cache'
import { defineLiveFold, foldLive, type LiveFoldDefinition } from './derived'
import type { StoreObserver } from './observer'
import {
  createLoomsStore,
  isPendingEvent,
  type CoalesceOption,
  type LoomsClientStore,
  type LoomsConnectionStatus,
} from './store'

export interface LoomsProviderProps {
  children: ReactNode
  endpoint?: string
  coalesce?: CoalesceOption
  transport?: SubscriptionTransport
  /**
   * How long a run's store stays connected and in memory after the last component using it
   * unmounts. Returning to the run within that time shows it at once, with no download. Defaults
   * to five seconds.
   */
  retainMs?: number
  /** Keeps each run's durable events on the device. See `indexedDbEventCache`. */
  cache?: EventCache
  /** Told how long each run took to show and how long each commit took. */
  observer?: StoreObserver
  /** Makes every HTTP request a run store sends. See `LoomsClientStoreOptions.fetch`. */
  fetch?: typeof fetch
  /** Opens a run store's live socket, in place of the global `WebSocket`. */
  webSocket?: SubscriptionSocketConstructor
  /**
   * The read grant for a run, for a host on another origin than the page. Asked each time a
   * store connects. See `LoomsClientStoreOptions.grant`.
   */
  grant?: RunGrantSource
  /** The id format run stores draw from. See `LoomsClientStoreOptions.ids`. */
  ids?: LoomsIds
}

/** What gives a run's current read grant, or undefined when it has none. */
export type RunGrantSource = (runId: string) => string | undefined

/** How a store reaches its host. Not part of which store a run gets: the first to open it decides. */
interface StoreReach {
  readonly fetch?: typeof fetch
  readonly webSocket?: SubscriptionSocketConstructor
  readonly grant?: RunGrantSource
  readonly ids?: LoomsIds
}

interface ProviderContextValue extends StoreReach {
  endpoint: string
  coalesce?: CoalesceOption
  transport?: SubscriptionTransport
  retainMs?: number
  cache?: EventCache
  observer?: StoreObserver
}

const LoomsContext = createContext<ProviderContextValue>({ endpoint: '' })
const DEFAULT_RETAIN_MS = 5_000

interface RegistryEntry {
  store: LoomsClientStore
  refs: number
  retainMs: number
  disposal: Fiber.Fiber<void> | undefined
}

const registry = new Map<string, RegistryEntry>()

interface StoreIdentity extends StoreReach {
  readonly endpoint: string
  readonly reconnectDelayMs?: number
  readonly coalesce?: CoalesceOption
  readonly transport?: SubscriptionTransport
  readonly threadId?: string
  readonly includeEphemeral?: boolean
  /** Only read when the store is created; a store already open keeps the cursor it started at. */
  readonly fromSeq?: number
  readonly retainMs?: number
  readonly cache?: EventCache
  readonly observer?: StoreObserver
}

function registryKey(runId: string, identity: StoreIdentity): string {
  return [
    identity.endpoint,
    runId,
    identity.transport ?? '',
    identity.threadId ?? '',
    identity.includeEphemeral === false ? '0' : '1',
  ].join('\0')
}

function disposeEntry(key: string): void {
  const entry = registry.get(key)

  if (!entry || entry.refs > 0) {
    return
  }

  entry.store.dispose()
  registry.delete(key)
}

function scheduleDisposal(key: string, retainMs: number): Fiber.Fiber<void> {
  return Effect.runFork(
    Effect.sleep(retainMs).pipe(Effect.andThen(Effect.sync(() => disposeEntry(key)))),
  )
}

function peekStore(runId: string, identity: StoreIdentity): LoomsClientStore {
  const key = registryKey(runId, identity)
  const existing = registry.get(key)

  if (existing) {
    return existing.store
  }

  const store = createLoomsStore({
    storeId: runId,
    endpoint: identity.endpoint,
    reconnectDelayMs: identity.reconnectDelayMs,
    coalesce: identity.coalesce,
    transport: identity.transport,
    threadId: identity.threadId,
    includeEphemeral: identity.includeEphemeral,
    fromSeq: identity.fromSeq,
    cache: identity.cache,
    observer: identity.observer,
    fetch: identity.fetch,
    webSocket: identity.webSocket,
    grant: identity.grant === undefined ? undefined : () => identity.grant?.(runId),
    ids: identity.ids,
  })

  const retainMs = Math.max(0, identity.retainMs ?? DEFAULT_RETAIN_MS)

  registry.set(key, {
    store,
    refs: 0,
    retainMs,
    // A store that is peeked at and never mounted is not kept for the full retention.
    disposal: scheduleDisposal(key, Math.min(retainMs, DEFAULT_RETAIN_MS)),
  })

  return store
}

function retainStore(runId: string, identity: StoreIdentity): void {
  const key = registryKey(runId, identity)
  peekStore(runId, identity)
  const entry = registry.get(key)

  if (!entry) {
    return
  }

  entry.refs += 1

  if (entry.disposal !== undefined) {
    Effect.runFork(Fiber.interrupt(entry.disposal))
    entry.disposal = undefined
  }
}

function releaseStore(runId: string, identity: StoreIdentity): void {
  const key = registryKey(runId, identity)
  const entry = registry.get(key)

  if (!entry) {
    return
  }

  entry.refs = Math.max(0, entry.refs - 1)

  if (entry.refs === 0 && entry.disposal === undefined) {
    entry.disposal = scheduleDisposal(key, entry.retainMs)
  }
}

/** Root provider that supplies the Looms host endpoint to run stores. */
export function LoomsProvider({
  children,
  endpoint = '',
  coalesce,
  transport,
  retainMs,
  cache,
  observer,
  fetch,
  webSocket,
  grant,
  ids,
}: LoomsProviderProps) {
  const value = useMemo(
    () => ({
      endpoint,
      coalesce,
      transport,
      retainMs,
      cache,
      observer,
      fetch,
      webSocket,
      grant,
      ids,
    }),
    [endpoint, coalesce, transport, retainMs, cache, observer, fetch, webSocket, grant, ids],
  )

  return createElement(LoomsContext.Provider, { value, children })
}

export interface UseRunStoreOptions {
  endpoint?: string
  reconnectDelayMs?: number
  coalesce?: CoalesceOption
  transport?: SubscriptionTransport
  threadId?: string
  includeEphemeral?: boolean
  /** See `LoomsClientStoreOptions.fromSeq`. Read once, when the store is first created. */
  fromSeq?: number
  retainMs?: number
}

/**
 * Everything that decides which store a run gets when there is no provider to supply part of
 * it. Inside React the provider gives `endpoint`, `coalesce`, `transport`, `retainMs`, `cache`
 * `observer`, `fetch`, `webSocket`, `grant` and `ids`; outside it the caller passes them.
 */
export interface RunStoreOptions extends UseRunStoreOptions {
  /** Makes every HTTP request the store sends. See `LoomsClientStoreOptions.fetch`. */
  fetch?: typeof fetch
  /** Opens the store's live socket, in place of the global `WebSocket`. */
  webSocket?: SubscriptionSocketConstructor
  /** The read grant for a run. See `LoomsClientStoreOptions.grant`. */
  grant?: RunGrantSource
  /** The id format the store draws from. See `LoomsClientStoreOptions.ids`. */
  ids?: LoomsIds
  /** Keeps the run's durable events on the device. See `indexedDbEventCache`. */
  cache?: EventCache
  /** Told how long the run took to show and how long each commit took. */
  observer?: StoreObserver
}

export interface PreloadRunStoreOptions extends RunStoreOptions {
  /** Stops waiting. The promise rejects with the signal's reason and the store is let go. */
  signal?: AbortSignal
}

/**
 * Opens a run's store outside React and resolves with it once it has caught up to the log,
 * which is when `store.synced()` turns true.
 *
 * This is for code that runs before a page renders, such as a route loader: await it, and the
 * components that then call `useRunStore` for the same run get this store, already filled,
 * instead of connecting and replaying the log on screen.
 *
 * A store is found by its endpoint, run, transport, thread and `includeEphemeral`, so pass the
 * same values the provider is given, or the hook will open a second store. Sharing one options
 * object between `LoomsProvider` and this call is the simplest way. `cache`, `observer` and
 * `fromSeq` are taken from whichever of the two opens the store first.
 *
 * The store is held while this waits and then kept for `retainMs`, like one whose last
 * component unmounted, so a page has that long to take it over. With no `signal` it waits for
 * as long as the log takes to arrive.
 */
export function preloadRunStore(
  runId: string,
  options: PreloadRunStoreOptions = {},
): Promise<LoomsClientStore> {
  const { signal, ...rest } = options
  const identity: StoreIdentity = { ...rest, endpoint: rest.endpoint ?? '' }

  if (signal?.aborted) {
    return Promise.reject(signal.reason)
  }

  const { promise, resolve, reject } = Promise.withResolvers<LoomsClientStore>()

  retainStore(runId, identity)

  const store = peekStore(runId, identity)

  let done = false
  // A store calls a new listener at once, which is before there is anything to unsubscribe.
  let unsubscribe: (() => void) | undefined

  const finish = (settle: () => void) => {
    if (done) {
      return
    }

    done = true
    unsubscribe?.()
    signal?.removeEventListener('abort', onAbort)
    releaseStore(runId, identity)
    settle()
  }

  const onAbort = () => finish(() => reject(signal?.reason))

  unsubscribe = store.subscribe(() => {
    if (store.synced()) {
      finish(() => resolve(store))
    }
  })

  if (done) {
    unsubscribe()
  }

  signal?.addEventListener('abort', onAbort, { once: true })

  return promise
}

/**
 * Acquires a non-subscribing handle to the run store.
 * Retains the store in memory while mounted; does NOT trigger component re-renders.
 * Use data hooks (`useRunEvents`, `useProjection`, `useRunSummary`, etc.) to subscribe.
 */
export function useRunStore(runId: string, options?: UseRunStoreOptions): LoomsClientStore {
  const context = useContext(LoomsContext)
  const endpoint = options?.endpoint ?? context.endpoint
  const reconnectDelayMs = options?.reconnectDelayMs
  const coalesce = options?.coalesce ?? context.coalesce
  const transport = options?.transport ?? context.transport
  const threadId = options?.threadId
  const includeEphemeral = options?.includeEphemeral
  const fromSeq = options?.fromSeq
  const retainMs = options?.retainMs ?? context.retainMs

  const identity = {
    endpoint,
    reconnectDelayMs,
    coalesce,
    transport,
    threadId,
    includeEphemeral,
    fromSeq,
    retainMs,
    cache: context.cache,
    observer: context.observer,
    fetch: context.fetch,
    webSocket: context.webSocket,
    grant: context.grant,
    ids: context.ids,
  }

  const store = peekStore(runId, identity)

  useEffect(() => {
    retainStore(runId, identity)
    return () => releaseStore(runId, identity)
  }, [runId, endpoint, reconnectDelayMs, coalesce, transport, threadId, includeEphemeral])

  return store
}

function useStoreSnapshot<T, TEvent extends AnyEventEnvelope>(
  store: LoomsClientStore<TEvent>,
  getSnapshot: () => T,
): T {
  const subscribe = useCallback((onChange: () => void) => store.subscribe(onChange), [store])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Subscribe to incremental projection state. */
export function useProjection<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  definition: ProjectionDefinition<S>,
): S {
  const getSnapshot = useCallback(() => store.project(definition), [store, definition])
  return useStoreSnapshot(store, getSnapshot)
}

/** Subscribe to arbitrary store derivations with an equality check. */
export function useRunSelector<Selected, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  selector: (store: LoomsClientStore<TEvent>) => Selected,
  isEqual: (a: Selected, b: Selected) => boolean = Object.is,
): Selected {
  const lastSelected = useRef<Selected | undefined>(undefined)
  const lastVersion = useRef<number>(-1)

  const getSnapshot = useCallback(() => {
    const version = store.version()

    if (lastVersion.current === version && lastSelected.current !== undefined) {
      return lastSelected.current
    }

    lastVersion.current = version
    const nextSelected = selector(store)

    if (lastSelected.current !== undefined && isEqual(lastSelected.current, nextSelected)) {
      return lastSelected.current
    }

    lastSelected.current = nextSelected

    return nextSelected
  }, [store, selector, isEqual])

  return useStoreSnapshot(store, getSnapshot)
}

export interface RunSummary {
  readonly status: RunStatus
  /** True once the run is completed, failed, or cancelled and accepts no new signals. */
  readonly finished: boolean
  /** True when the run failed or was cancelled, so a fork can continue it from where it stopped. */
  readonly resumable: boolean
  readonly kind: string | undefined
  readonly definitionName: string | undefined
  readonly rootThreadId: string | undefined
  readonly startedAt: number | undefined
  /** The effect in another run that launched this one. */
  readonly launchedBy: RunLaunchSource | undefined
  readonly attributes: RunAttributes
  readonly connection: LoomsConnectionStatus
  /** False while the store is still catching up to the log, when empty state means "loading". */
  readonly synced: boolean
}

function shallowEqualSummary(a: RunSummary, b: RunSummary): boolean {
  return (
    a.status === b.status &&
    a.kind === b.kind &&
    a.definitionName === b.definitionName &&
    a.rootThreadId === b.rootThreadId &&
    a.startedAt === b.startedAt &&
    a.launchedBy === b.launchedBy &&
    sameStringRecord(a.attributes, b.attributes) &&
    a.connection === b.connection &&
    a.synced === b.synced
  )
}

/** Lightweight subscription to top-level run metadata and connection status. */
export function useRunSummary<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
): RunSummary {
  const selector = useCallback((s: LoomsClientStore<TEvent>): RunSummary => {
    const run = s.getState().runs.get(s.storeId)
    const status = run?.status ?? 'running'

    return {
      status,
      finished: isTerminalStatus(status),
      resumable: status === 'failed' || status === 'cancelled',
      kind: run?.kind ?? undefined,
      definitionName: run?.definitionName ?? undefined,
      rootThreadId: run?.rootThreadId ?? undefined,
      startedAt: s.query.startedAt(),
      launchedBy: run?.launchedBy ?? undefined,
      attributes: run?.attributes ?? {},
      connection: s.status(),
      synced: s.synced(),
    }
  }, [])

  return useRunSelector(store, selector, shallowEqualSummary)
}

/** Subscribe to the event log, optionally scoped to a single thread. */
export function useRunEvents<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  options?: { threadId?: string },
): readonly TEvent[] {
  const threadId = options?.threadId
  const getSnapshot = useCallback(() => store.events({ threadId }), [store, threadId])
  return useStoreSnapshot(store, getSnapshot)
}

/** Subscribe to the thread hierarchy tree. */
export function useThreadTree<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
): ThreadTree {
  const treeState = useProjection(store, threadTree)
  return useMemo(() => toThreadTree(treeState), [treeState])
}

/** Subscribe to event count per thread. */
export function useEventCounts<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
): ReadonlyMap<string, number> {
  const getSnapshot = useCallback(() => store.query.counts(), [store])
  return useStoreSnapshot(store, getSnapshot)
}

/** Subscribe to a single event by its sequence number. */
export function useEventBySeq<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  seq: number | undefined,
): TEvent | undefined {
  const selector = useCallback(
    (s: LoomsClientStore<TEvent>) => (seq !== undefined ? s.query.bySeq(seq) : undefined),
    [seq],
  )

  return useRunSelector(store, selector)
}

/** Subscribe to the latest event of a given type. */
export function useLatestEvent<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  type: string,
): TEvent | undefined {
  const selector = useCallback((s: LoomsClientStore<TEvent>) => s.query.latest(type), [type])
  return useRunSelector(store, selector)
}

/** Subscribe to a live fold, which includes ephemeral events. */
export function useLiveFold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  fold: LiveFoldDefinition<S, TEvent>,
): S {
  const getSnapshot = useCallback(() => store.fold(fold), [store, fold])
  return useStoreSnapshot(store, getSnapshot)
}

export { createLoomsStore, isPendingEvent }
export { defineLiveFold, foldLive }
export type {
  LoomsClientStore,
  CommitOptions,
  LoomsClientStoreOptions,
  LoomsConnectionStatus,
  LoomsStoreQuery,
  CoalesceOption,
  StoreListener,
} from './store'
export type { LiveFoldDefinition } from './derived'
export type { LoomsRegister, RegisteredEvent, AnyEventEnvelope } from '@looms/core'
