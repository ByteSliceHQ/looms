---
'@swirls/looms': minor
---

Let `authorize` say who a request acts as, and decide in a Cloudflare Worker.

- An allowed `AuthDecision` may carry `actorId` (`authAllowedAs(actorId)`). Events sent through
  `POST /runs/:runId/events` and named signals are then recorded with
  `origin: { type: 'external', actorId }`, replacing any origin the request claimed.
- `RouteInfo` has `signal` (`namespace/name`) for named signal requests, so a policy can allow
  specific signals.
- `describeRoute(method, pathname)` describes a request's Looms route without a runtime.
- `routeToDurableObject` takes `authorize`, checked in the Worker before a request is forwarded. The
  actor it names reaches the Durable Object in a header clients cannot set; `forwardedActorAuth()`
  on the object records it.
