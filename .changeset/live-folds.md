---
'@swirls/looms': minor
---

`createFold`, `useEventFold`, and `EventFoldDefinition` in `@swirls/looms/react` are now `defineLiveFold`, `useLiveFold`, and `LiveFoldDefinition`. A live fold always sees ephemeral events, so the `includeEphemeral` option is gone; use a projection for anything that does not need them. Live folds take an optional `shape` schema that infers their state type.
