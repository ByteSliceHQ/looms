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

import { threadTree, toThreadTree, type ProjectionDefinition, type ThreadTree } from '@looms/core'

import { createFold, foldEvents, type EventFoldDefinition } from './derived'
import type { AnyEventEnvelope, RegisteredEvent } from './register'
import {
  createLoomsStore,
  type CoalesceOption,
  type LoomsClientStore,
  type LoomsConnectionStatus,
} from './store'

export interface LoomsProviderProps {
  children: ReactNode
  endpoint?: string
  coalesce?: CoalesceOption
}

interface ProviderContextValue {
  endpoint: string
  coalesce?: CoalesceOption
}

const LoomsContext = createContext<ProviderContextValue>({ endpoint: '' })
const GRACE_MS = 5_000

interface RegistryEntry {
  store: LoomsClientStore
  refs: number
  disposal: Fiber.Fiber<void> | undefined
}

const registry = new Map<string, RegistryEntry>()

function registryKey(endpoint: string, runId: string): string {
  return `${endpoint}\0${runId}`
}

function disposeEntry(key: string): void {
  const entry = registry.get(key)

  if (!entry || entry.refs > 0) {
    return
  }

  entry.store.dispose()
  registry.delete(key)
}

function scheduleDisposal(key: string): Fiber.Fiber<void> {
  return Effect.runFork(
    Effect.sleep(GRACE_MS).pipe(Effect.andThen(Effect.sync(() => disposeEntry(key)))),
  )
}

function peekStore(
  runId: string,
  endpoint: string,
  reconnectDelayMs?: number,
  coalesce?: CoalesceOption,
): LoomsClientStore {
  const key = registryKey(endpoint, runId)
  const existing = registry.get(key)

  if (existing) {
    return existing.store
  }

  const store = createLoomsStore({
    storeId: runId,
    endpoint,
    reconnectDelayMs,
    coalesce,
  })

  registry.set(key, {
    store,
    refs: 0,
    disposal: scheduleDisposal(key),
  })

  return store
}

function retainStore(
  runId: string,
  endpoint: string,
  reconnectDelayMs?: number,
  coalesce?: CoalesceOption,
): void {
  const key = registryKey(endpoint, runId)
  peekStore(runId, endpoint, reconnectDelayMs, coalesce)
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

function releaseStore(runId: string, endpoint: string): void {
  const key = registryKey(endpoint, runId)
  const entry = registry.get(key)

  if (!entry) {
    return
  }

  entry.refs = Math.max(0, entry.refs - 1)

  if (entry.refs === 0 && entry.disposal === undefined) {
    entry.disposal = scheduleDisposal(key)
  }
}

/** Root provider that supplies the Looms host endpoint to run stores. */
export function LoomsProvider({ children, endpoint = '', coalesce }: LoomsProviderProps) {
  const value = useMemo(() => ({ endpoint, coalesce }), [endpoint, coalesce])
  return createElement(LoomsContext.Provider, { value, children })
}

export interface UseRunStoreOptions {
  endpoint?: string
  reconnectDelayMs?: number
  coalesce?: CoalesceOption
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
  const store = peekStore(runId, endpoint, reconnectDelayMs, coalesce)

  useEffect(() => {
    retainStore(runId, endpoint, reconnectDelayMs, coalesce)
    return () => releaseStore(runId, endpoint)
  }, [runId, endpoint, reconnectDelayMs, coalesce])

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
  readonly status: string
  readonly kind: string | undefined
  readonly definitionName: string | undefined
  readonly rootThreadId: string | undefined
  readonly startedAt: number | undefined
  readonly connection: LoomsConnectionStatus
}

function shallowEqualSummary(a: RunSummary, b: RunSummary): boolean {
  return (
    a.status === b.status &&
    a.kind === b.kind &&
    a.definitionName === b.definitionName &&
    a.rootThreadId === b.rootThreadId &&
    a.startedAt === b.startedAt &&
    a.connection === b.connection
  )
}

/** Lightweight subscription to top-level run metadata and connection status. */
export function useRunSummary<TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
): RunSummary {
  const selector = useCallback((s: LoomsClientStore<TEvent>): RunSummary => {
    const run = s.getState().runs.get(s.storeId)

    return {
      status: run?.status ?? 'running',
      kind: run?.kind ?? undefined,
      definitionName: run?.definitionName ?? undefined,
      rootThreadId: run?.rootThreadId ?? undefined,
      startedAt: s.query.startedAt(),
      connection: s.status(),
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

/** Subscribe to a custom incremental fold. */
export function useEventFold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  store: LoomsClientStore<TEvent>,
  fold: EventFoldDefinition<S, TEvent>,
): S {
  const getSnapshot = useCallback(() => store.fold(fold), [store, fold])
  return useStoreSnapshot(store, getSnapshot)
}

export { createLoomsStore }
export { createFold, foldEvents }
export type {
  LoomsClientStore,
  LoomsClientStoreOptions,
  LoomsConnectionStatus,
  LoomsStoreQuery,
  CoalesceOption,
  StoreListener,
} from './store'
export type { EventFoldDefinition } from './derived'
export type { LoomsRegister, RegisteredEvent, AnyEventEnvelope } from './register'
