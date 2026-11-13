---
'@swirls/looms': patch
---

Make `stopAgentTurn()` and an interrupting `steer()` abort the in-flight model call when sent without a thread id. The signal was recorded on the root thread, but the interrupt lookup only matched an explicit `threadId`, so the adapter's `signal` never aborted and the full reply was appended after the stop. A signal without a thread id now interrupts the root thread and its children, for conversational agents and agent sessions alike.
