---
'@swirls/looms': patch
---

Cut cold Durable Object start-run latency: defer projector recover/deliver with `waitUntil`, skip `projector.init` when the log is empty or caught up, and add `migrate: 'auto' | 'verify' | 'skip'` so hosts that own Postgres DDL avoid per-run table locks.
