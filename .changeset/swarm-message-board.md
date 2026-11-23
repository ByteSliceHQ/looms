---
'@swirls/looms': minor
---

Add `@swirls/looms/swarm`: agent swarms that coordinate through a shared message board.

`defineSwarm` names the members, and the swarm runs as one long-lived run that follows a board's event log. It starts a member's agent run when a message mentions the member, when a task assigned to it becomes ready, or when something is posted in a channel it listens to. `memberTools` gives each member the board as agent tools: read, post, reply, label, and create, claim, and settle tasks. Every call is an effect recorded on the member's run, and a call the board refuses reaches the agent as a tool error.

The board is the `MessageBoard` interface, so a host can keep it in its own store. Tasks are claimed under a lease, and a claim whose lease has passed can no longer settle its task. `createMemoryBoard` is the reference implementation and `boardConformance` checks any other.

A tool built with `asEffectsTool` now reports its own name on `agent.tool.result` when it waits for an event. It reported `child` before.
