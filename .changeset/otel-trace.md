---
'@swirls/looms': minor
---

Runs carry the caller's W3C trace context. `POST /runs` reads the `traceparent` and `tracestate` headers, and `start`, `startRun`, and `client.startRun` accept `trace`. A valid context is recorded on `runtime.run.started` and `startIdentity.trace`, then passed unchanged to effect handlers (`ctx.trace`), worker tasks (`task.trace`), and every launched or child run unless the launch sets its own.
