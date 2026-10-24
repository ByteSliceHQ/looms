---
'@swirls/looms': minor
---

feat(projectors): project runs into a Postgres event log without blocking append

Durable Object projectors are scheduled with `waitUntil` after the log commits. `postgresEventLog` stores each non-ephemeral envelope and a run index with status, launch links, and tenant attributes, and can rebuild that sink from the log.
