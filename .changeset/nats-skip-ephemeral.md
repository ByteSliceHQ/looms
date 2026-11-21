---
'@swirls/looms': minor
---

The NATS projector can leave ephemeral events out of the stream: `natsProjector({ ephemeral: 'skip' })`. Ephemeral events take sequence numbers in a run's log, so a batch whose newest event is ephemeral ends with one cursor message on `<run's subjects>.looms.cursor`, carrying that sequence in `Looms-Seq` and `Looms-Cursor: true`. It replaces the run's earlier cursor, so a run holds at most one, and `position` and the hole check work as before. A reader of the stream skips it. The stream has to set `allow_rollup_hdrs`; a host transport is told which message replaces the earlier ones on its subject by `replaces` on the message. The default is unchanged: ephemeral events are stored, marked by `Looms-Ephemeral`.
