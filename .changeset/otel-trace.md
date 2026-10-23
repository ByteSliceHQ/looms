---
'@swirls/looms': minor
---

feat(otel): propagate W3C trace context across runs, effects, worker tasks, and child runs

Stores W3C `traceparent` and `tracestate` on `RunStartIdentity`, exposes child spans on `EffectContext` and `EffectWorkerTask`, propagates trace links into child runs, and exports trace context utilities from `@looms/otel`.
