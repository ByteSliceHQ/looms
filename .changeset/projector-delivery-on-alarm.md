---
'@swirls/looms': patch
---

Deliver Durable Object projectors from the alarm instead of under the appending request's `waitUntil`, which kept `stub.fetch` open for seconds of Hyperdrive/Postgres I/O after the handler returned. Add `ProjectorDelivery.nextDueAt(runId)`, which the alarm deadline now includes, so delivery still owed when a run finishes is not dropped by a later rearm.
