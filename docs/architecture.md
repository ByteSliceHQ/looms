# Architecture

## Actors

An **actor** is identified by `actorId` and is either:

- `agent` — message turns, tool calls, optional child agents/workflows via tools
- `workflow` — DAG of nodes with deps, reviews, timers, and nested spawns

All durable facts are `LoomsEvent` records in an `EventStore` log. `reduceActor(events)` derives `ActorState` and **owed work** (what the host must do next).

## Wake loop

`LoomsRuntime.wake(actorId)`:

1. Read the log and reduce
2. While not terminal and not parked, pick actionable owed work
3. Execute (agent turn, tool, workflow schedule/node, finalize)
4. Append produced events (and start child actors)
5. Repeat

Parking:

- `waiting_review` — until `review.decided` / timeout
- `waiting_child` — until `child.completed` (+ `tool.result` for agent-tools)
- `waiting_timer` — until `timer.fired`

## Definitions

```ts
defineAgent({ name, instructions, input?, tools?, runTurn? })
defineWorkflow({ name, input?, nodes: [{ id, deps?, run }], output? })
asAgentTool({ name, agent, mapInput? })
asWorkflowTool({ name, workflow, mapInput? })
```

Inputs are validated with Standard Schema (Zod, Valibot, ArkType, Effect Schema). `runTurn` enables deterministic offline / test agents without an LLM.

## Runtime Facade (`createLooms`)

The `createLooms()` facade provides a synchronous constructor with a Promise-based API and a universal `fetch(req)` handler:

```ts
const looms = createLooms({
  definitions,
  store: s2Lite(), // or memory, or s2(config)
})

// Unified HTTP handler returning Response | null
const res = await looms.fetch(req)
```

## HTTP surface

`createLooms().serve()` / `createLooms().fetch()`:

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/actors/agent` | Start agent |
| POST | `/actors/workflow` | Start workflow |
| GET | `/actors/:id/state` | Reduced state |
| GET | `/actors/:id/events` | Event log |
| POST | `/actors/:id/signal` | Append + wake |
| POST | `/actors/:id/reviews/:reviewId/decide` | HITL |
| * | `/api/livestore` | Pull/push proxy for clients |

## Stores

- **Memory** (`makeMemoryEventStore`) — default for demos/tests
- **S2** (`@looms/s2`) — durable streams

## Projectors

Projectors are optional secondary indexes. They never become the source of truth. Implement `Projector` or use a first-party helper:

```ts
import { createLooms } from '@looms/runtime'
import { sqlite } from '@looms/projectors/sqlite'

const looms = createLooms({
  definitions,
  projectors: [sqlite({ path: './looms.db' })],
})
```

`postgres({ url })` and `memory()` satisfy the same interface. `createLooms` calls `init` before the first append and `dispose` on `stop()`.

## Client materialization

`@looms/livestore/react` ships the opinionated LiveStore schema (SQLite tables + materializers), web adapter, and React hooks. Light clients can use `createLoomsStore` from `@looms/livestore` to poll and materialize in memory without React.
