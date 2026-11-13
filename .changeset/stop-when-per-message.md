---
'@swirls/looms': patch
---

Count `stopWhen` steps per user message for conversational agents. `stopWhen` received the thread's lifetime turn number, so `stepCountIs(8)` on a conversational agent stopped every turn after the eighth and dropped its tool calls. The `turn` passed to `stopWhen` now counts from the latest user message for a conversational agent, the same way `maxTurns` does. Other agents are unchanged.
