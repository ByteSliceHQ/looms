# LiveStore

Subscribe to a run from the browser. `@looms/livestore/react` connects to the host's event log over SSE, caches incremental projections, and delivers stable snapshots to React with frame-rate coalescing.

## Quick Start

```tsx
import {
  LoomsLiveStoreProvider,
  useRunStore,
  useProjection,
  useRunSummary,
  useRunEvents,
} from '@looms/livestore/react'
import { conversation, userMessage } from '@looms/agent'
import { decision, pendingApprovals } from '@looms/approval'

function RunView({ runId }: { runId: string }) {
  // Acquires the store handle without subscribing the container to event churn
  const store = useRunStore(runId)

  // Fine-grained subscriptions: each hook only wakes its component when relevant data changes
  const summary = useRunSummary(store)
  const convo = useProjection(store, conversation)
  const approvals = useProjection(store, pendingApprovals)

  return (
    <div>
      <div>
        Status: {summary.status} ({summary.connection})
      </div>
      <div>Messages: {convo.lines.length}</div>
      <div>Pending approvals: {approvals.items.length}</div>
      <button onClick={() => store.commit(userMessage('Hello'))}>Send</button>
    </div>
  )
}
```

Wrap your root in `LoomsLiveStoreProvider`:

```tsx
<LoomsLiveStoreProvider endpoint="http://127.0.0.1:8787" coalesce="adaptive">
  <App />
</LoomsLiveStoreProvider>
```

## React SDK Hooks (`@looms/livestore/react`)

| Hook                                             | Purpose                                                                                                           | Re-renders                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `useRunStore(runId, options)`                    | Handle to run store (retain/release). Non-subscribing.                                                            | Never on events                                |
| `useProjection(store, def, selector?, isEqual?)` | Incremental projection state. Folds only new events since last render.                                            | When projected state or selected slice changes |
| `useRunEvents(store, { threadId? })`             | Readonly frozen array snapshot of the event log (or thread slice).                                                | When matching events arrive                    |
| `useRunSummary(store)`                           | Top-level metadata (`status`, `kind`, `definitionName`, `rootThreadId`, `startedAt`, `eventCount`, `connection`). | When summary fields change                     |
| `useThreadTree(store)`                           | Thread hierarchy tree.                                                                                            | When thread lifecycle changes                  |
| `useEventCounts(store)`                          | Per-thread event counts (`ReadonlyMap<string, number>`).                                                          | When counts increment                          |
| `useRunSelector(store, selector, isEqual?)`      | Custom selector over the store with equality comparison.                                                          | When selected value changes                    |
| `useEventBySeq(store, seq)`                      | Single event lookup by sequence number.                                                                           | When seq event is applied                      |
| `useLatestEvent(store, type)`                    | Latest event of a given type.                                                                                     | When matching event arrives                    |
| `useEventFold(store, fold)`                      | App-defined incremental fold (can include ephemeral events like text deltas).                                     | When fold state changes                        |

## Typed Event Catalogs

Wire events arrive as JSON, but your modules already declare typed Effect Schema catalogs. Register them once so React hooks infer payloads without casts:

```ts
// runtime.ts
import type { EventsOf } from '@looms/core'

export function demoModules() {
  return [agent(), workflow(), approval()] as const
}

export type DemoEvents = EventsOf<typeof demoModules>

declare module '@looms/livestore' {
  interface LoomsRegister {
    events: DemoEvents // or `modules: typeof demoModules`
  }
}
```

After that, `useRunEvents(store)` returns `readonly DemoEvents[]`, and narrowing on `event.type` unlocks typed payloads:

```tsx
const store = useRunStore(runId)
const events = useRunEvents(store) // readonly DemoEvents[]

const completed = events.find((e) => e.type === 'runtime.thread.completed')
if (completed) {
  console.log(completed.payload.output) // typed
}
```

For multi-runtime apps, skip global registration and pass an explicit event type to the hooks:

```tsx
import type { EventsOf } from '@looms/core'
import { useRunStore, useRunEvents } from '@looms/livestore/react'

type AppEvents = EventsOf<typeof demoModules>

const store = useRunStore<AppEvents>(runId)
const events = useRunEvents(store) // readonly AppEvents[]
```

## Streaming Hundreds of Events

When LLM agents generate dozens of parallel subthreads and stream thousands of tokens or tool calls, unoptimized frontends freeze the main thread. Looms is designed to stream high-velocity logs smoothly:

1. **Subscribe Narrowly**: Containers should call `useRunStore(runId)` for the store handle and pass it down. Do not subscribe parent shells to `useRunEvents` or unselected projections.
2. **Use Projection Selectors**: Use `useProjection(store, def, (s) => s.specificSlice)` so components skip rendering when other projection fields update.
3. **Keep Fold Definitions Module-Level**: Define `createFold` objects at module scope so the store's internal `WeakMap` cache can track incremental state across renders.
4. **Coalesced Notifications**: By default, `createLoomsStore` uses `coalesce: 'adaptive'`: quiet streams notify on the next macrotask so counters can tick +1, while bursts collapse to at most one notify per animation frame. Other options: `'frame'`, `'immediate'`, or `{ delayMs: number }`.
5. **Virtualize Lists**: For event feeds or dense logs, virtualize the scroll viewport (e.g. `@tanstack/react-virtual` or `@looms/debugger`'s `EventStream`).

## Standalone Store (Vanilla JS)

```ts
import { createLoomsStore } from '@looms/livestore'

const store = createLoomsStore({
  storeId: runId,
  endpoint: 'http://127.0.0.1:8787',
  coalesce: 'adaptive',
})

store.subscribe(() => {
  console.log(`Version ${store.version()}, status: ${store.status()}`)
})

await store.sync()
console.log(store.events().length)
```
