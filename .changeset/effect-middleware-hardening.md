---
'@swirls/looms': minor
---

Effect middleware can call `failEffect` and have it become `runtime.effect.failed` instead of failing the wake. `onEffect` wraps middleware for one effect definition with a typed input. `assertCredits` and `trackUsage` on `defineAgent` are deprecated in favor of middleware and the `tokenUsage` / `agent.turn.usage` projection path. Docs cover middleware scope (local effects only).
