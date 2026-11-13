---
'@swirls/looms': patch
---

Count `maxTurns` per user message for conversational agents. The turn counter ran over the whole conversation, so a chat with `maxTurns: 3` failed with "Max turns exceeded" on its fourth reply. A conversational agent now counts model turns from its latest user message (or steer), so the limit bounds the work spent on one reply. Agents that are not conversational still count every turn of the run.
