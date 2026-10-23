---
'@swirls/looms': minor
---

Agents gain structured output through a `submit_output` tool, one compaction-and-retry when the model reports a context overflow, `resolveTools` for tools that depend on the agent input, an `assertCredits` gate before each model call, and `trackUsage` beside a new `agent.turn.usage` event. Team members spawned with `asAgentTool` stop at `TEAM_MEMBER_MAX_DEPTH` (3); the parent sends the child its depth with a new `agent.lineage` event.
