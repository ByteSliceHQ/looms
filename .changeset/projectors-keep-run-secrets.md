---
'@swirls/looms': patch
---

Keep `runSecrets` (and `readStream`) on event stores wrapped by `withProjectors`, `withBlobOffload`, and the testing fault injector, so a Durable Object configured with projectors can still provision and hand secrets to attempts instead of failing with "secrets are unavailable".
