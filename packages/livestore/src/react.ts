import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react'
import { project, type ProjectionDefinition } from '@looms/core'
import { createLoomsStore, type LoomsClientStore } from './store'

export interface LoomsLiveStoreProviderProps {
  children: ReactNode
  endpoint?: string
}

const EndpointContext = createContext('')

/** Root provider that supplies the Looms host endpoint to run stores. */
export function LoomsLiveStoreProvider({
  children,
  endpoint = '',
}: LoomsLiveStoreProviderProps) {
  return createElement(EndpointContext.Provider, { value: endpoint, children })
}

export interface UseRunStoreOptions {
  endpoint?: string
  pollIntervalMs?: number
}

export function useRunStore(runId: string, options?: UseRunStoreOptions): LoomsClientStore {
  const contextEndpoint = useContext(EndpointContext)
  const endpoint = options?.endpoint ?? contextEndpoint
  const [store, setStore] = useState(() =>
    createLoomsStore({
      storeId: runId,
      endpoint,
      pollIntervalMs: options?.pollIntervalMs,
    }),
  )
  const [, setTick] = useState(0)

  useEffect(() => {
    const next =
      store.storeId === runId
        ? store
        : createLoomsStore({
            storeId: runId,
            endpoint,
            pollIntervalMs: options?.pollIntervalMs,
          })
    if (next !== store) setStore(next)
    const unsubscribe = next.subscribe(() => {
      setTick((n) => n + 1)
    })
    return unsubscribe
  }, [store, runId, endpoint, options?.pollIntervalMs])

  return store
}

export function useProjection<S>(store: LoomsClientStore, definition: ProjectionDefinition<S>): S {
  return project(definition, store.events())
}

export { createLoomsStore }
export type { LoomsClientStore, LoomsClientStoreOptions, StoreListener } from './store'
