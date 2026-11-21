---
'@swirls/looms': patch
---

A rebuilt Durable Object no longer drops a wake its alarm was holding. When an object was evicted with its alarm set for a wake owed now (from `launch` or a signal sent with `wake: 'schedule'`) or for a liveness deadline, and a request rebuilt it before that alarm fired, the new object replaced the alarm with the later deadline read back from run state, and the run sat until then. The alarm an object starts with is now kept until the runtime asks for a wake at or before it, or an alarm fires.
