---
'@swirls/looms': minor
---

Effect middleware can call `failEffect` and have it become `runtime.effect.failed` instead of failing the wake. `onEffect` wraps middleware for one effect definition with a typed input. Docs cover middleware scope (local effects only) and the `tokenUsage` / `agent.turn.usage` projection path for billing.
