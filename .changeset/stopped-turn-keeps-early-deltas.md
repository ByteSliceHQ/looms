---
'@swirls/looms': patch
---

Keep text deltas that were streamed just before a turn was stopped. Live events are written in the background, and a wake whose only attempt was aborted released the run without flushing them, so a delta emitted moments before `stopAgentTurn()` could be missing from the log. The wake now flushes pending live events before it parks.
