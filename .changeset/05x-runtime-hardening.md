---
'@swirls/looms': patch
---

Fix 0.5.x durability gaps: cancel launched children before recording close.requested; prime definition resolvers from snapshots; resolve relative WebSocket bases; filter SSE by threadId/includeEphemeral; write filesystem blobs atomically and repair corrupt digests; require start-to-close or heartbeat timeouts for acknowledged workers and retry lost terminal queue callbacks; clear workflow wait-child pending state on node finish.
