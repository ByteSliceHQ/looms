---
'@swirls/looms': minor
---

A signal can be answered as soon as its events are committed, without waiting for the run to finish acting on them. Pass `{ wake: 'schedule' }` to `signal` on the runtime, `createLooms`, an actor host or a Durable Object stub: it resolves once the events are on the log and leaves the wake to the scheduler, as `launchRun` does. Over HTTP, `POST /runs/:id/events` and `POST /runs/:id/signals/:namespace/:name` do the same when sent with `Prefer: respond-async` or `?respond=async`, and answer `202`. The `state` in that answer is the one the events were committed against; follow the event stream for what the run does next. `store.commit` in `@swirls/looms/react` now asks for this, so it resolves when the event is committed and no longer stays open for the length of an agent turn.
