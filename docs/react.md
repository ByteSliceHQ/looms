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
      <button onClick={() => store.commit(userMessage({ content: 'Hello' }))}>Send</button>
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

## Optimistic Commits

`store.commit` resolves once the host has committed the event. With `optimistic`, the event is shown before that: it is folded into every projection and live fold at once, after all confirmed events, and the host's own copy takes its place when it arrives. If the commit fails the event is removed and `commit` rejects, so the caller decides what to tell the person.

```tsx
const store = useRunStore(runId)

async function send(content: string) {
  try {
    await store.commit(userMessage({ content }), { optimistic: true })
  } catch (cause) {
    // The message has already been taken back out of the conversation.
    setError(cause)
  }
}
```

Set `optimistic` on `createLoomsStore` to make it the default for every commit. `store.pending()` lists the events still waiting, and `isPendingEvent(event)` tells a reducer or a row whether it is looking at one, for example to dim a message that has not been confirmed.

An optimistic event is your guess at what the host will record. It is matched to the confirmed event by the commit's `idempotencyKey`, which is generated unless you pass one. When writes go through a route of your own, pass `send` and have that route signal the run with the same key:

```ts
await store.commit(say({ messageId, text }), {
  optimistic: true,
  idempotencyKey: messageId,
  send: ({ signal }) => postMessage(runId, { messageId, text }, signal),
})
```

A commit the host accepts but never records under that key stops being shown after ten seconds.

## Loading State and Retention

`useRunSummary(store).synced` is false until the store holds everything the log had when it connected. Until then an empty projection means the run is still loading, not that it is empty.

`LoomsProvider` takes `retainMs`: how long a run's store stays connected after the last component using it unmounts. The default is five seconds. An app that moves between runs can raise it so going back to a run shows it at once.

`useRunStore(runId, { fromSeq })` starts the store at a later point in the log. Use it when you already hold state up to `fromSeq - 1`, such as a projection the host served, and fold only what follows. The store never sees earlier events, so its own projections and summary cover only the part it followed.

## Client-Only Projections

`useProjection` folds the events the browser already has, so a projection does not have to be registered on the host. Register it in a module when the host, the HTTP API, or the debugger needs it too. Reducers receive events from your registered catalog (see [Typed Event Catalogs](#typed-event-catalogs)) unless you annotate the `event` parameter. This example assumes the agent module is registered:

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

Ephemeral events are provisional. When the runtime retries an effect, the reducer never sees the ephemeral events from the attempts the retry replaced, so a failed attempt's partial text disappears without extra code. The reducer still resets on domain events, such as the durable message that replaces streamed text. Forking a run elides ephemeral events entirely.

`shape` is optional. It is a Zod, Effect Schema, or other Standard Schema object that infers the state type, so you do not pass a generic when `initialState` is narrower than the state, such as an empty array. Like the projection example, this assumes the agent module is registered.

```tsx
import { z } from 'zod'
import { defineLiveFold, useLiveFold, useRunStore } from '@swirls/looms/react'

const streamingText = defineLiveFold({
  name: 'streamingText',
  shape: z.object({ parts: z.array(z.string()) }),
  initialState: { parts: [] },
  reduce(state, event) {
    switch (event.type) {
      case 'agent.turn.text_delta':
        return { parts: [...state.parts, event.payload.delta] }
      case 'agent.message':
        return { parts: [] }
      default:
        return state
    }
  },
})

export function StreamingReply({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const streaming = useLiveFold(store, streamingText)

  return <p>{streaming.parts.join('')}</p>
}
```

Define live folds at module scope. The store caches incremental state in a `WeakMap` keyed by the definition object. Outside React, `foldLive(fold, events)` returns the same state `useLiveFold` would for that event list.

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
