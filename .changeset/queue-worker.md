---
'@swirls/looms': minor
---

feat(cloudflare): run worker effects over Cloudflare Queues

`cloudflareQueueWorker` sends each attempt to a queue as JSON, with the run's trace context and the attempt's deadlines; inputs over 100 KB travel as a blob reference and secrets stay off the queue. `queueConsumer` (push) and `createQueuePullConsumer` with `cloudflareQueuePullSource` (HTTP pull) run handlers that heartbeat, read secrets through the worker callback API, and stop when the run is cancelled. The consumer acks after `started`, so Looms owns retries; duplicate and stale deliveries are dropped, and dead-lettered messages are recovered by the schedule-to-start timeout. The pull consumer batches acks, backs off when idle, reports the backlog, and drains on `stop()`. `createMemoryQueue` gives tests the same lease and dead-letter behavior.

In the runtime, `EffectWorker.dispatchSemantics: 'acknowledged'` fails a rejected dispatch under the retry policy instead of parking it as ambiguous, and creating a runtime fails if such a worker claims an effect without `retry.scheduleToStartTimeoutMs`. Worker tasks carry `deadlines`, and `maxInFlightWorkerEffects` caps the worker attempts one run has in flight.
