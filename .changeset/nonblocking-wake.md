---
'@swirls/looms': patch
---

Keep handling signals while local effects are in flight. The wake loop forks each `(thread, causingSeq)` effect group and replans when a joined or coalesced signal arrives, so a long tool call on one thread no longer blocks intake, narration, or steers aimed at other threads.
