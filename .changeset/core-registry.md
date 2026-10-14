---
'@swirls/looms': minor
---

`LoomsRegister`, `RegisteredEvent`, and `AnyEventEnvelope` now live in `@swirls/looms/core`; `@swirls/looms/react` re-exports them, so existing `declare module '@swirls/looms/react'` registrations keep working. Standalone `defineProjection` reducers receive the registered event union, so client-only projections are typed without annotations. Registered event payloads were previously typed as `any`; they now carry their catalog types, so code that relied on `any` may need to narrow on `event.type` first.
