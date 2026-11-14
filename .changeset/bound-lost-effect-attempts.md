---
'@swirls/looms': patch
---

An in-process effect whose attempts keep being lost now fails instead of being re-attempted without limit. When a wake finds an attempt that an earlier wake started and never finished, because its process was lost or the wake failed, it still starts the next attempt, but only while attempts remain: up to the effect's `maxAttempts`, or three attempts when the effect has no retry policy. After that the effect fails with `attempt N was lost before it finished, and no attempts remain`. Attempts ended by a signal in the same wake, such as steering an agent, are not treated as lost.
