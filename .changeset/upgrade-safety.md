---
'@swirls/looms': minor
---

feat(testing): replay recorded run logs in CI and document effect contracts

Adds a production-shaped event-log corpus under `packages/testing/corpus`, folded
deterministically in CI with `assertCorpusEntry`. Documents versioning effect
types (`payments.charge@v2`) and worker `handles` so fleets can roll out beside
each other without Temporal-style patches.
