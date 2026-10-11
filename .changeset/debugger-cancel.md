---
'@swirls/looms': minor
---

`POST /runs/:id/cancel` and `client.cancel(runId, threadId?)` cancel a run or thread over HTTP. The debugger's Cancel button now uses it, so cancelling an in-flight agent turn stops the run instead of retrying the turn. Cancel stays available while a wake is running, and Wake reports whether it found pending work. Client run tables, the debugger, and projector indexes now mark a cancelled run as `cancelled` instead of `running`.

Signals sent to a completed, failed, or cancelled run now reject with `RunTerminalError` (HTTP 409) instead of being appended and ignored. Retrying a signal whose `idempotencyKey` was already accepted still succeeds. `useRunSummary` exposes `finished`, and the debugger disables the agent follow-up composer and approval decisions on finished runs.
