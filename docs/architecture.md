# Concepts

Looms models application work as a **run**: one durable event log that you can crash-recover, replay, and subscribe to from a UI. You plug in **modules** for agents, workflows, approvals, or your own domain.

## Why this shape

- **Durable by default.** Progress is the log. Restart the host and the run continues from the last event.
- **Composable.** A checkout workflow can wait on an approval, then invoke your payments module. An agent can spawn that workflow as a tool.
- **One stream, many views.** The same events power a chat transcript, a debugger timeline, a ledger, and pending-approval badges.
- **Human in the loop.** A run parks until someone decides. The UI posts `approval.decided`; the run resumes.

## Run and thread

A `Run` is the unit you start, list, and open in a debugger (`runId`). Inside it, `Thread`s form a tree: a root agent or workflow, plus any children it spawned.

Status is `running`, `waiting` (parked on a timer, approval, or child), or terminal (`completed`, `failed`, `cancelled`).

## Ids

Runs, threads, events, and waits are named by an id format. The default is [TypeID](https://github.com/jetify-com/typeid): `run_`, `thr_`, `evt_`, or `wait_` followed by 26 characters that encode a UUID. Ids Looms draws carry a UUIDv7 and sort by creation time within a process. Ids a reducer derives for a child carry a UUIDv8 whose bits are SHA-256 over the parts, so replay names the same child every time. Effect ids are `<threadId>:<tag>`.

Pass `ids` to change the format:

```ts
import type { LoomsIds } from '@swirls/looms/core'

const ids: LoomsIds = {
  create: (kind) => newId(kind), // 'event' | 'run' | 'thread' | 'wait'
  derive: (kind, parts) => hashId(kind, parts), // 'run' | 'thread'
}

const looms = createLooms({ ids, modules })
```

The option is accepted by `createLooms`, `createRuntime`, `createActorCell`, `createLocalActorHost`, the Durable Object config, `routeToDurableObject`, the queue consumer, `createLoomsClient`, `LoomsProvider` / `createLoomsStore`, and `DebuggerShell`. Use one format per deployment. Reducers and effect handlers read it as `ctx.ids`.

A custom format must keep these rules:

- An id is a non-empty string.
- An id contains no `:`.
- `derive` is a pure function of `kind` and `parts`. Looms cannot check this one.

The first two are checked when the option is given and for every id the format returns; a violation throws `InvalidIdFormatError`.

Changing the format renames every derived child, so a run in flight across the change will not replay. Let in-flight runs finish first.

## Events, effects, and waits

Facts go on the log as typed events. When a thread needs the host to do something — call an LLM, charge a card, wait for a human — it requests an **effect**. When it needs to pause, it registers a **wait** (on an event type, a payload match, or a timer).

The host processes outstanding effects, then parks until a matching event arrives. You resume a run by signaling (approval, user message) or by waiting for a timer.

## Projections

A projection is a read model folded from the log: `conversation`, `pendingApprovals`, a payments `ledger`. The same reducer runs on the server and in the browser via `useProjection`, so the UI stays consistent with the host.

## Replay

Because state is derived from events, you can inspect any point in a run. `replayTo(runId, seq)` gives state before and after that event — useful for a debugger and for tests that assert determinism.

## Hosting

```ts
import { createLooms } from '@swirls/looms/runtime'

const looms = createLooms({
  modules: [
    agent({ definitions: [echo, assistant] }),
    workflow({ definitions: [checkout] }),
    approval(),
    payments,
  ],
})

await looms.start(assistant, 'Charge $40 after approval')
await looms.start(checkout, { amount: 150, currency: 'USD' })
```

The host has one verb for starting work. An agent and a workflow are just different thread kinds, so `start` takes the definition and infers the input type from its schema.

`createLooms` is the single-process embed path (one runtime, one store). For one writer per `runId`, use `createLocalActorHost` (`@swirls/looms/actor`) locally or `LoomsDurableObject` (`@swirls/looms/cloudflare`) on Workers / celld — see [snapshots.md](./snapshots.md).

See [modules.md](./modules.md) to compose capabilities, and [protocol.md](./protocol.md) for event types and HTTP.
