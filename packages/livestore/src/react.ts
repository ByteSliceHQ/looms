import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { project, type ProjectionDefinition } from '@looms/core'

import { createLoomsStore, type LoomsClientStore } from './store'

export interface LoomsLiveStoreProviderProps {
  children: ReactNode
  endpoint?: string
}

const EndpointContext = createContext('')
const GRACE_MS = 5_000

interface RegistryEntry {
  store: LoomsClientStore
  refs: number
  timer: ReturnType<typeof setTimeout> | undefined
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

function peekStore(runId: string, endpoint: string, pollIntervalMs?: number): LoomsClientStore {
  const key = registryKey(endpoint, runId)
  const existing = registry.get(key)

  if (existing) {
    return existing.store
  }

  const store = createLoomsStore({
    storeId: runId,
    endpoint,
    pollIntervalMs,
  })

  registry.set(key, {
    store,
    refs: 0,
    timer: setTimeout(() => disposeEntry(key), GRACE_MS),
  })

  return store
}

function retainStore(runId: string, endpoint: string, pollIntervalMs?: number): void {
  const key = registryKey(endpoint, runId)
  peekStore(runId, endpoint, pollIntervalMs)
  const entry = registry.get(key)

  if (!entry) {
    return
  }

  entry.refs += 1

  if (entry.timer !== undefined) {
    clearTimeout(entry.timer)
    entry.timer = undefined
  }
}

function releaseStore(runId: string, endpoint: string): void {
  const key = registryKey(endpoint, runId)
  const entry = registry.get(key)

  if (!entry) {
    return
  }

  entry.refs = Math.max(0, entry.refs - 1)

  if (entry.refs === 0 && entry.timer === undefined) {
    entry.timer = setTimeout(() => disposeEntry(key), GRACE_MS)
  }
}

/** Root provider that supplies the Looms host endpoint to run stores. */
export function LoomsLiveStoreProvider({ children, endpoint = '' }: LoomsLiveStoreProviderProps) {
  return createElement(EndpointContext.Provider, { value: endpoint, children })
}

export interface UseRunStoreOptions {
  endpoint?: string
  reconnectDelayMs?: number
  /** @deprecated Use `reconnectDelayMs`. */
  pollIntervalMs?: number
}

export function useRunStore(runId: string, options?: UseRunStoreOptions): LoomsClientStore {
  const contextEndpoint = useContext(EndpointContext)
  const endpoint = options?.endpoint ?? contextEndpoint
  const reconnectDelayMs = options?.reconnectDelayMs ?? options?.pollIntervalMs
  const store = peekStore(runId, endpoint, reconnectDelayMs)

  useEffect(() => {
    retainStore(runId, endpoint, reconnectDelayMs)
    return () => releaseStore(runId, endpoint)
  }, [runId, endpoint, reconnectDelayMs])

  const subscribe = useCallback(
    (onChange: () => void) => store.subscribe(() => onChange()),
    [store],
  )

  const getSnapshot = useCallback(() => store.getState(), [store])
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return store
}

export function useProjection<S>(store: LoomsClientStore, definition: ProjectionDefinition<S>): S {
  return project(definition, store.events())
}

export { createLoomsStore }
export type { LoomsClientStore, LoomsClientStoreOptions, StoreListener } from './store'
