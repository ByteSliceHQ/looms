---
'@swirls/looms': minor
---

Add `@swirls/looms/nats`, a projector that replicates committed events to a NATS JetStream stream. Each event goes to `<prefix>.run.<runId>.<type>` with the JSON envelope as the body and `Looms-*` headers. Batches are JetStream atomic batches fenced on the run's last stream sequence, so a batch lands whole or not at all, redelivery is a no-op, and `position` lets durable delivery rewind and refill a stream that fell behind. Requires nats-server 2.12 or newer.
