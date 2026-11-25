---
'@swirls/looms': minor
---

Swarms can be paused, resumed and started again under the same run id, and survive a board whose log was reset. `mcpTools` binds arguments only to the tools that declare them, scripted models see which agent, run and model they serve, and a Durable Object can read a projection of its run directly.

**Swarms**

- New signals `pause()`, `resume()` and `restart({ board?, after? })`. A paused swarm keeps its cursor and inboxes and wakes nobody until resumed. A restart starts a new generation in the same run: clean member state, a new cursor (kept, given, or `null` for the start of the log), and activation run ids that include the generation, so they never collide with an earlier generation's. The first generation's run ids are unchanged.
- `ensureSwarm` restarts a stopped or halted swarm and answers `'restarted'`, leaves a paused swarm paused and answers `'paused'`, and takes `{ restart: { after } | false }`. Concurrent ensures start one generation.
- A board refuses a cursor its current log did not issue with the new `cursor_unknown` code, and the swarm reads the new log from its start instead of waiting forever.
- `swarmStatus` gains `generation`, `error` and `resets`, and its `status` is now `running | paused | stopping | stopped | halted | failed | cancelled`.

**Breaking for hosts**

- `stop()` no longer completes the swarm's run: the run stays open, `swarmStatus.status` becomes `stopped`, and `restart()` or `ensureSwarm` starts it again. Cancel the run to end a swarm for good. `swarmStatus.status` is never `completed`.
- A swarm whose board refuses it, or whose definition is unknown, halts (`swarm.halted`, `swarmStatus.status: 'halted'`) instead of failing its run.
- `SwarmHost` (what `ensureSwarm` takes) now needs `signal` and `project`, which `createLooms` already has.
- `activationRunId` takes `{ swarmRunId, member, activation, generation? }` and then `ids`.
- `LlmCompleteArgs` has new required fields `agent`, `turn` and `input`; an adapter called by hand must pass them.

**Breaking for board implementers**

- `events({ after })` must reject with `BoardError` code `cursor_unknown` when its current log did not issue `after` (past the end, another board's, or from before a reset), never answer it with an empty page. Put a log id or epoch in cursors if the log can start again. `createMemoryBoard` cursors now carry a log id (option `logId`).
- `boardConformance` checks this, and may call the factory a second time per check: boards from separate calls must be separate logs.

**Agents**

- `mcpTools` `bind` sends a bound field only to tools whose input schema declares it, and still hides it from those tools. A field bound to `undefined` stays hidden and unsent, and tools that require it are left out of the run's tools.
- `llmPolicy.toolCallsFor` receives a `StubLlmContext`: the real thread id, turn and input, plus `run`, `agent` and `model`. A real `llm.complete` receives the same `agent`, `turn` and `input`.

**Hosts**

- `LoomsDurableObject.project(definition)` folds a registered projection over the object's run; `projection(name)` does it by name over RPC, and `readProjection(stub, definition)` types the answer. Actor cells and `createLocalActorHost` gain `project` too. An unregistered name rejects with `UnknownProjectionError`.
