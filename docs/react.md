# React

Subscribe to a run from the browser. `@swirls/looms/react` connects to the host's event log over SSE, caches incremental projections, and delivers stable snapshots to React with frame-rate coalescing.

## Quick Start

```tsx
import {
  LoomsProvider,
  useRunStore,
  useProjection,
  useRunSummary,
  useRunEvents,
} from '@swirls/looms/react'
import { conversation, userMessage } from '@swirls/looms/agent'
import { decision, pendingApprovals } from '@swirls/looms/approval'

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

Wrap your root in `LoomsProvider`:

```tsx
<LoomsProvider endpoint="http://127.0.0.1:8787" coalesce="adaptive">
  <App />
</LoomsProvider>
```

## Hooks (`@swirls/looms/react`)

| Hook                                        | Purpose                                                                                                           | Re-renders                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `useRunStore(runId, options)`               | Handle to run store (retain/release). Non-subscribing.                                                            | Never on events               |
| `useProjection(store, def)`                 | Incremental projection state. Folds only new events since last render.                                            | When projected state changes  |
| `useRunEvents(store, { threadId? })`        | Readonly frozen array snapshot of the event log (or thread slice).                                                | When matching events arrive   |
| `useRunSummary(store)`                      | Top-level metadata (`status`, `kind`, `definitionName`, `rootThreadId`, `startedAt`, `eventCount`, `connection`). | When summary fields change    |
| `useThreadTree(store)`                      | Thread hierarchy tree.                                                                                            | When thread lifecycle changes |
| `useEventCounts(store)`                     | Per-thread event counts (`ReadonlyMap<string, number>`).                                                          | When counts increment         |
| `useRunSelector(store, selector, isEqual?)` | Custom selector over the store with equality comparison.                                                          | When selected value changes   |
| `useEventBySeq(store, seq)`                 | Single event lookup by sequence number.                                                                           | When seq event is applied     |
| `useLatestEvent(store, type)`               | Latest event of a given type.                                                                                     | When matching event arrives   |
| `useLiveFold(store, fold)`                  | Live fold state, including ephemeral events such as text deltas.                                                  | When fold state changes       |

## Client-Only Projections

`useProjection` folds the events the browser already has, so a projection does not have to be registered on the host. Register it in a module when the host, the HTTP API, or the debugger needs it too. Reducers receive events from your registered catalog (see [Typed Event Catalogs](#typed-event-catalogs)):

```ts
import { defineProjection } from '@swirls/looms/core'
import { z } from 'zod'

export const toolCalls = defineProjection({
  name: 'toolCalls',
  shape: z.object({ names: z.array(z.string()) }),
  initialState: { names: [] },
  reduce(state, event) {
    if (event.type !== 'agent.tool_call.requested') {
      return state
    }

    return { names: [...state.names, event.payload.toolCall.name] }
  },
})
```

## Live Folds

Projections skip ephemeral events. A live fold, defined with `defineLiveFold`, sees them; use it for provisional UI such as text an agent is still streaming, and use a projection for everything else.

Ephemeral events are not replayable. A retried effect leaves its earlier attempt's events in the log, and forking a run elides them. A live fold's reducer must reset when the durable event that supersedes them lands, and when the effect that emitted them is retried.

`shape` is optional. It is a Zod, Effect Schema, or other Standard Schema object that infers the state type, so you do not pass a generic when `initialState` is narrower than the state.

```tsx
import { z } from 'zod'
import { defineLiveFold, useLiveFold, useRunStore } from '@swirls/looms/react'

const streamingText = defineLiveFold({
  name: 'streamingText',
  shape: z.object({
    effectId: z.string().nullable(),
    text: z.string(),
  }),
  initialState: { effectId: null, text: '' },
  reduce(state, event) {
    switch (event.type) {
      case 'agent.turn.text_delta':
        return { effectId: event.effectId ?? null, text: state.text + event.payload.delta }
      case 'agent.message':
        return { effectId: null, text: '' }
      case 'runtime.effect.retry.scheduled':
        return event.payload.effectId === state.effectId ? { effectId: null, text: '' } : state
      default:
        return state
    }
  },
})

export function StreamingReply({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const streaming = useLiveFold(store, streamingText)

  return <p>{streaming.text}</p>
}
```

Define live folds at module scope. The store caches incremental state in a `WeakMap` keyed by the definition object. Outside React, `foldEvents(fold, events)` runs the same reducer over an event list.

## Typed Event Catalogs

Wire events arrive as JSON, but your modules already declare typed Effect Schema catalogs. Register them once so React hooks infer payloads without casts:

```ts
// runtime.ts
import type { EventsOf } from '@swirls/looms/core'

export function demoModules() {
  return [agent(), workflow(), approval()] as const
}

export type DemoEvents = EventsOf<typeof demoModules>

declare module '@swirls/looms/react' {
  interface LoomsRegister {
    events: DemoEvents // or `modules: typeof demoModules`
  }
}
```

After that, `useRunEvents(store)` returns `readonly DemoEvents[]`, standalone `defineProjection` reducers receive `DemoEvents`, and narrowing on `event.type` unlocks typed payloads:

```tsx
const store = useRunStore(runId)
const events = useRunEvents(store) // readonly DemoEvents[]

for (const event of events) {
  if (event.type === 'runtime.thread.completed') {
    console.log(event.payload.output) // typed
  }
}
```

`Array.prototype.find` with a plain predicate does not narrow the element type; use a loop or a type-guard predicate.

For multi-runtime apps, skip global registration and pass an explicit event type to the hooks:

```tsx
import type { EventsOf } from '@swirls/looms/core'
import { useRunStore, useRunEvents } from '@swirls/looms/react'

type AppEvents = EventsOf<typeof demoModules>

const store = useRunStore<AppEvents>(runId)
const events = useRunEvents(store) // readonly AppEvents[]
```

## Streaming Hundreds of Events

When LLM agents generate dozens of parallel subthreads and stream thousands of tokens or tool calls, unoptimized frontends freeze the main thread. Looms is designed to stream high-velocity logs smoothly:

1. **Subscribe Narrowly**: Containers should call `useRunStore(runId)` for the store handle and pass it down. Do not subscribe parent shells to `useRunEvents` or unselected projections.
2. **Select Projection Slices**: Use `useRunSelector(store, (s) => s.project(def).specificSlice)` so components skip rendering when other projection fields update.
3. **Keep Definitions Module-Level**: Define projections and live folds at module scope so the store's internal `WeakMap` cache can track incremental state across renders.
4. **Coalesced Notifications**: By default, `createLoomsStore` uses `coalesce: 'adaptive'`: quiet streams notify on the next macrotask so counters can tick +1, while bursts collapse to at most one notify per animation frame. Other options: `'frame'`, `'immediate'`, or `{ delayMs: number }`.
5. **Virtualize Lists**: For event feeds or dense logs, virtualize the scroll viewport (e.g. `@tanstack/react-virtual` or `@swirls/looms/debugger`'s `EventStream`).

## Standalone Store (Vanilla JS)

```ts
import { createLoomsStore } from '@swirls/looms/react'

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
