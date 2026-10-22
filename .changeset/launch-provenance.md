---
'@swirls/looms': minor
---

A run started from an effect through `RunLauncher` now records its source on `runtime.run.started`. The payload's `launchedBy` holds the launching run, thread, and effect, plus the id and seq of the event that requested the effect. The event's origin is `{ type: 'run', runId }`, and its `correlationId` names the root run of the launch chain. The runtime sets these fields itself and replaces any value a handler passes. `RunState.startIdentity` exposes both fields, and a later start of the same run id that does not match them rejects with `StartRunConflictError`.

The launching run's log gets a new `runtime.run.launched` event for each start the target accepts. It carries the started run's id and definition plus the effect id, so listing what a run launched reads that run's log alone.

The index projectors store `launchedByRunId`, `launchedByEffectId`, and `correlationId` on run rows, and `listLaunched(runId)` returns the runs a run launched. Their version is now 3, so delivery replays history to fill the new columns, and `init` adds the columns to existing SQLite and Postgres tables.

`useRunSummary` returns `launchedBy`. The debugger shows a Launched by link above the thread tree that opens the launching run at the requesting event, the event inspector links `runtime.run.launched` and `runtime.run.started` to the run on the other side, and `openRun` accepts a `{ seq }` target.
