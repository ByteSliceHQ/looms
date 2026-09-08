# LiveStore integration

Looms ships two client paths:

1. **Full (React)** — `@looms/livestore/react` owns the LiveStore schema, in-memory web adapter, Looms-native `SyncBackend`, and React hooks. Consumers do **not** install `@livestore/*`.
2. **Light** — `createLoomsStore` from `@looms/livestore` polls `/api/livestore` and materializes in memory (no React / no SQLite).

The `@looms/demo` app uses the full path: TanStack Start UI + `@looms/livestore/react` → Looms sync backend → `/api/livestore` → EventStore (memory or S2). LiveStore **0.5.0-dev** peers Effect 4 (same major line as Looms); do not mix LiveStore 0.4 (Effect 3).

## Quick demo (full LiveStore + auto-started s2-lite)

```bash
bun install
bun run demo
# → http://127.0.0.1:8787
```

In dev, `s2-lite` auto-starts if installed. No secondary terminal or bridge configuration is required.
The Looms sync backend connects directly to Looms's `/api/livestore` endpoint, reading and writing to the EventStore directly without dual-stream mirroring.

## Full LiveStore (React)

```ts
import {
  LoomsLiveStoreProvider,
  useActorStore,
  useSyncStatus,
  queries,
  decideReview,
  sendMessage,
  type LoomsStore,
} from '@looms/livestore/react'

function App({ children }) {
  return <LoomsLiveStoreProvider>{children}</LoomsLiveStoreProvider>
}

function ActorView({ actorId }: { actorId: string }) {
  const store = useActorStore(actorId)
  const messages = store.useQuery(queries.messages)

  // Commit typed review decision
  decideReview(store, { reviewId: 'rev_1', outcome: 'approve' })

  // Send a message
  sendMessage(store, 'Hello from the client!')
}
```

`@looms/livestore` depends on `@livestore/*` internally. Apps only need `@looms/livestore` (+ `react` / `react-dom`).

## Materializer (always available)

```ts
import { materializeActor, createLoomsStore } from '@looms/livestore'

const tables = materializeActor(events)
// tables.actors / messages / turns / nodes / reviews / events
```

`createLoomsStore({ storeId, endpoint, pollIntervalMs? })`:

1. Polls `GET ${endpoint}/api/livestore?storeId=&cursor=`
2. Materializes into memory
3. Returns `{ storeId, getState, query, subscribe, commit, sync, dispose }`

## Host proxy

`@looms/runtime` mounts `/api/livestore`:

- `HEAD` — reachability ping
- `GET ?storeId=&cursor=` — non-live pull batch returning `{ batch: Global.Encoded[], head }`
- `GET ?storeId=&cursor=` (with `Accept: text/event-stream` or `live=1`) — live SSE streaming of new events
- `POST` — push batch; decodes `Global.Encoded`, validates sequence numbers, appends with conflict detection (returns `409` on mismatch), and wakes the actor
