---
'@looms/react': minor
'@looms/core': minor
'@looms/runtime': minor
'@looms/client': minor
'@looms/actor': minor
'@looms/cloudflare': patch
---

Rename `@looms/livestore` to `@looms/react` and drop LiveStore protocol names.

- Package and React provider are now `@looms/react` / `LoomsProvider`.
- Live event HTTP is `GET /api/events?runId=` (pull or SSE). Wire batches are Looms event envelopes.
- `LiveStoreGlobalEncoded` is now `EncodedLoomsEvent`.
