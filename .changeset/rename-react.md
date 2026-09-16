---
'@swirls/looms': patch
---

Rename `@swirls/looms/react` to `@swirls/looms/react` and drop LiveStore protocol names.

- Package and React provider are now `@swirls/looms/react` / `LoomsProvider`.
- Live event HTTP is `GET /api/events?runId=` (pull or SSE). Wire batches are Looms event envelopes.
- `LiveStoreGlobalEncoded` is now `EncodedLoomsEvent`.
