---
'@swirls/looms': minor
---

feat(agent): add structured output, compaction, dynamic tools, usage hooks, and depth limit

Adds first-class structured output via `submit_output`, context compaction with overflow retry, dynamic tool resolution per turn, pre-turn credit gates, post-turn usage tracking with `agent.turn.usage`, and `TEAM_MEMBER_MAX_DEPTH = 3` subagent depth enforcement.
