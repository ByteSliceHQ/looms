---
'@swirls/looms': minor
---

Worker callbacks now answer `{ status: 'accepted' | 'stale' | 'cancelled', cancelRequested }` instead of the run state. `createLooms().workerCallback` and `createLoomsClient().workerCallback` return that result. `cancelRequested` tells an attempt that is already running to stop, because a dispatch that has left the host cannot be recalled. A stale report records nothing.

`failEffect({ error, nonRetryable, retryAfterMs })` fails the current attempt. `nonRetryable` ends the effect even when the retry policy has attempts left. `retryAfterMs` waits at least that long before the next attempt and never shortens the policy backoff. Worker `fail` callbacks take the same two fields.

A heartbeat may include `details`. The latest details are kept across retries and included on the next `EffectWorkerTask`, so a resumed attempt can continue from the recorded progress.
