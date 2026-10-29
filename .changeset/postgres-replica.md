---
'@swirls/looms': minor
---

A Postgres replica copies every run into a database you own. `postgresReplica` stores the full event envelope, folds the run summary in the same transaction, and records `replicated_seq` only through a contiguous prefix, so a restored database or a replica attached mid-run catches up instead of leaving a hole. `status` reports whether that copy is complete. `purge` deletes event copies for finished runs and later deliveries skip them.

`looms replica generate` writes the versioned SQL into your migration folder (and a Drizzle journal, when you ask). `looms replica migrate` applies it. `@swirls/looms/replica/drizzle` exports the tables, and `loomsReplicaTables` adds columns your application owns.
