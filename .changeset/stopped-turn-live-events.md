---
'@swirls/looms': patch
---

Keep a run alive when a message follows a stopped agent turn. A model call that was stopped mid-stream could emit one more text delta after its turn was abandoned. That late write failed, and the failure stuck to the run, so the next turn's first `onTextDelta` threw "Cannot append live events without a store" and the run failed. Live events from an attempt that has been aborted or has finished are now dropped.
