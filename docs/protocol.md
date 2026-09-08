# Protocol

Events you will see on a run, and the HTTP a host exposes.

## Lifecycle

| Type | When it appears |
|---|---|
| `runtime.run.started` / `completed` | The run begins or finishes |
| `runtime.thread.started` / `completed` / `failed` / `cancelled` | An agent, workflow, or child starts or ends |
| `runtime.wait.registered` / `satisfied` | The run parked, then a matching event arrived |
| `runtime.timer.set` / `fired` | A sleep or deadline |
| `runtime.signal.received` | Something posted to the run from outside (message, approval helper) |

Module events sit beside these: `agent.message.received`, `approval.decided`, `payments.charge.authorized`, and so on.

## Effects and waits

An **effect** is work the host should do: call an LLM, charge a card, request an approval. The handler appends events; those events may satisfy a **wait**.

Typical wait: a workflow node invokes `payments.charge` and waits on `payments.charge.authorized` (or `declined`). An approval uses `gate({ title })`, which requests a decision and waits on `approval.decided` for that id.

Matching is by event `type` plus an optional payload subset (`match: { approvalId }`).

`replayTo(runId, seq)` returns state before and after that event — the debugger and `@looms/testing` use it.

## HTTP

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness |
| `POST` | `/runs` | Start `{ kind, definitionName, input }` |
| `GET` | `/runs` | List run ids |
| `GET` | `/runs/:id` | Current run state |
| `GET` | `/runs/:id/events` | Event log (`?fromSeq=` for catch-up) |
| `POST` | `/runs/:id/events` | Signal the run |
| `GET` | `/runs/:id/threads` | Child threads |
| `POST` | `/runs/:id/wake` | Resume processing |
| `GET` | `/runs/:id/replay?seq=` | State before / after an event |
| `GET` | `/runs/:id/projections/:name` | Named read model |

`looms.fetch(request)` handles these paths (and `/api/livestore` for LiveStore). It returns `null` for everything else so you can mount Looms next to your own UI.

Use `@looms/client` (`createLoomsClient`) instead of hand-rolling fetch when you can.
