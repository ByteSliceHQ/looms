import type { ReactNode } from 'react'
import { createElement } from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { queryDb, StoreRegistry, type Store } from '@livestore/livestore'
import {
  StoreRegistryProvider,
  useStore,
  useSyncStatus,
  type ReactApi,
} from '@livestore/react'
import { LOOMS_EVENT_NAMES, type LoomsEventName } from './event-names'
import {
  decideReview,
  events,
  schema,
  sendMessage,
  tables,
  LoomsEnvelope,
  type ActorRow,
  type ChildRow,
  type EventLogRow,
  type MessageRow,
  type NodeRow,
  type ReviewRow,
} from './livestore-schema'
import {
  actorsQuery,
  childrenQuery,
  eventsQuery,
  messagesQuery,
  nodesQuery,
  queries,
  reviewsQuery,
  type LoomsQueryResult,
} from './queries'
import { actorStoreOptions, type ActorStoreOptionsConfig } from './web-adapter'

export type LoomsStore = Store<typeof schema> & ReactApi

const defaultRegistry = new StoreRegistry({
  defaultOptions: {
    batchUpdates,
  },
})

export type LoomsLiveStoreProviderProps = {
  children: ReactNode
  /** Optional custom registry; defaults to a module-scoped registry with React batching. */
  storeRegistry?: StoreRegistry
}

/** Root provider that wires LiveStore's StoreRegistry for Looms React apps. */
export function LoomsLiveStoreProvider({
  children,
  storeRegistry = defaultRegistry,
}: LoomsLiveStoreProviderProps) {
  return createElement(StoreRegistryProvider, { storeRegistry, children })
}

export type UseActorStoreOptions = ActorStoreOptionsConfig

const actorStoreOptionsByKey = new Map<string, ReturnType<typeof actorStoreOptions>>()

function cachedActorStoreOptions(actorId: string, endpoint?: string) {
  const key = `${actorId}\0${endpoint ?? ''}`
  const cached = actorStoreOptionsByKey.get(key)
  if (cached !== undefined) return cached
  const opts = actorStoreOptions(actorId, endpoint === undefined ? {} : { endpoint })
  actorStoreOptionsByKey.set(key, opts)
  return opts
}

/**
 * Subscribe to the per-actor Looms LiveStore (sync-s2 → `/api/livestore`).
 *
 * Must not call any React hooks before `useStore`. LiveStore suspends via
 * `React.use()`; a hook before that call is committed on the suspend pass,
 * then `useStore`'s `useEffect` appears on the next pass (rules-of-hooks).
 */
export function useActorStore(actorId: string, options?: UseActorStoreOptions): LoomsStore {
  return useStore(cachedActorStoreOptions(actorId, options?.endpoint))
}

export {
  actorStoreOptions,
  actorsQuery,
  childrenQuery,
  decideReview,
  events,
  eventsQuery,
  messagesQuery,
  nodesQuery,
  queries,
  queryDb,
  reviewsQuery,
  schema,
  sendMessage,
  tables,
  LOOMS_EVENT_NAMES,
  LoomsEnvelope,
  useSyncStatus,
}
export type {
  ActorRow,
  ActorStoreOptionsConfig,
  ChildRow,
  EventLogRow,
  MessageRow,
  NodeRow,
  ReviewRow,
  LoomsEventName,
  LoomsQueryResult,
}
