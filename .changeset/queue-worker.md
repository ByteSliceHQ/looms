---
'@swirls/looms': minor
---

feat(cloudflare): add native Cloudflare Queues effect worker and push/pull consumers

Adds `cloudflareQueueWorker` producer implementing `EffectWorker` with `dispatchSemantics: 'acknowledged'`, queue push/pull consumers with single-retry authority and mid-flight cancellation abort, and `maxInFlightWorkerEffects` fairness guard per run.
