---
'@swirls/looms': minor
---

Effects declare `placement: 'local' | 'worker'` on `m.effect`, `scope.effect`, or `defineEffect`. Local effects require `execute`; worker effects forbid it and implement the handler with `workerHandlers`. Queue routes take worker definitions, local and worker handlers get distinct context types, and `defineModule` rejects effects built outside the module's catalog. `GET /definitions/effects` publishes each declared effect, including placement, retry policy, and input schema.
