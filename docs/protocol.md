# Protocol

Events you will see on a run, and the HTTP a host exposes.

## Lifecycle

| Type                                                            | When it appears                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| `runtime.run.started` / `completed`                             | The run begins or finishes                                          |
| `runtime.thread.started` / `completed` / `failed` / `cancelled` | An agent, workflow, or child starts or ends                         |
| `runtime.wait.registered` / `satisfied`                         | The run parked, then a matching event arrived                       |
| `runtime.timer.set` / `fired`                                   | A sleep or deadline                                                 |
| `runtime.signal.received`                                       | Something posted to the run from outside (message, approval helper) |

Module events sit beside these: `agent.message.received`, `approval.decided`, `payments.charge.authorized`, and so on.

## Effects and waits

An **effect** is work the host should do: call an LLM, charge a card, request an approval. The handler appends events; those events may satisfy a **wait**.

Typical wait: a workflow node invokes `payments.charge` and waits on `payments.charge.authorized` (or `declined`). An approval uses `gate({ title })`, which requests a decision and waits on `approval.decided` for that id.

Matching is by event `type` plus an optional payload subset (`match: { approvalId }`).

`replayTo(runId, seq)` returns state before and after that event — the debugger and `@swirls/looms/testing` use it.

## HTTP

| Method | Path                          | Purpose                                                                                                                                                                                                                                                  |
| ------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/health`                     | Liveness                                                                                                                                                                                                                                                 |
| `POST` | `/runs`                       | Start `{ kind, definitionName, input }` (`Accept: text/event-stream` or `?stream=true` streams the log live)                                                                                                                                             |
| `GET`  | `/runs`                       | List run ids (`createLooms` / shared store). Actor hosts (`createLocalActorHost`, Durable Objects, celld) return `501` — use a projector lake or client-side history instead                                                                             |
| `GET`  | `/runs/:id`                   | Current run state                                                                                                                                                                                                                                        |
| `GET`  | `/runs/:id/events`            | Event log (`?fromSeq=&limit=`). SSE with `live=true` / `Accept: text/event-stream`, or a WebSocket with `Upgrade: websocket` on a Durable Object. Resumes after `Last-Event-ID` or `fromSeq`. `threadId` and `includeEphemeral=false` filter the stream. |
| `POST` | `/runs/:id/events`            | Signal the run                                                                                                                                                                                                                                           |
| `GET`  | `/runs/:id/threads`           | Child threads                                                                                                                                                                                                                                            |
| `POST` | `/runs/:id/wake`              | Resume processing                                                                                                                                                                                                                                        |
| `GET`  | `/runs/:id/replay?seq=`       | State before / after an event                                                                                                                                                                                                                            |
| `GET`  | `/runs/:id/projections/:name` | Named read model                                                                                                                                                                                                                                         |

`looms.fetch(request)` handles these paths. It returns `null` for everything else so you can mount Looms next to your own UI.

A live subscription speaks three frames. `{"type":"hello","head":1,"tail":4}` is sent first and reports the retained bounds. Event frames stay `{"batch":[...encoded events]}` and, on SSE, still use `id: <seq>`. `{"type":"resync","head":5,"reason":"trimmed"|"backpressure"}` means the cursor is below the retained log, or the socket fell behind; the server then closes the WebSocket with code `4000`. Resume from `head`. Clients that only read `batch` ignore the other two frames.

Use `@swirls/looms/client` (`createLoomsClient`) instead of hand-rolling fetch when you can.
