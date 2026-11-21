---
'@swirls/looms': minor
---

Let the NATS projector reach a stream without a NATS connection, and file a run's subjects under its attributes. `natsProjector` takes a `transport` with two operations, the last message on a subject filter and an atomic commit that expects a stream sequence, so a host behind an HTTP bridge supplies its own; `natsConnectionTransport` is the one over a connection and is still what `connection` or `connect` gives you. `subjectAttributes` puts the named run attributes before the run id, `<prefix>.run.<attributes>.<runId>.<type>`, so a consumer filters one tenant's events on the server. `NatsProjectorSettings` no longer holds `stream`, `createStream` and `timeoutMs`: they are `NatsStreamSettings`.
