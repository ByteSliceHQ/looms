---
'@swirls/looms': minor
---

A member activation that cannot start no longer ends its swarm's run.

- New `handlesEffectFailures` on `defineThread` and `m.thread`. Without it, a `runtime.effect.failed` that the thread answers with no new effect fails the thread. With it, the thread's reducer decides what each failed effect means, and the thread keeps running as the reducer left it.
- The swarm thread declares it. When an activation fails after its retries, such as for a member whose agent is not registered, the swarm drops that batch, keeps running, and wakes the member again for what reaches the board next. Before, the run failed and every later `nudge` and `ensureSwarm` for that run id threw.
- `swarmStatus` shows the failure: a member's `status` can be `failed`, and each member has `lastError`, why its latest activation could not start or its latest run failed. The debugger's Members pane shows it.
- A nudge, a finished member run or a `resume()` that arrives while a scheduled pull may already be reading the board now reads the board again once that pull lands. Before, the request was lost until the next poll, or for good when polling was off.

**Breaking:** `SwarmMemberStatus` has the new required `lastError` field and the new `failed` status.
