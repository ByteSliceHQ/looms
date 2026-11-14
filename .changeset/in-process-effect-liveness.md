---
'@swirls/looms': patch
---

A run on a Durable Object now recovers by itself when its isolate is lost while an in-process effect is running. Until now such a run had no alarm, so after an eviction, deploy, or crash mid-effect it stayed `running` until something signalled it. While a wake waits on in-process effects it now keeps the object's alarm about 30 seconds ahead and renews it; if the isolate goes away the alarm fires in a new one, the run wakes, and the effect is re-attempted as it already is on any later wake. `WakeScheduler` gains an optional `keepAlive` for hosts whose wakes outlive the process, and `livenessLeaseMs` sets the interval. Schedulers without `keepAlive`, including the default in-process one, behave as before.
