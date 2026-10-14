---
'@swirls/looms': minor
---

`createFold`, `useEventFold`, `EventFoldDefinition`, and `foldEvents` in `@swirls/looms/react` are now `defineLiveFold`, `useLiveFold`, `LiveFoldDefinition`, and `foldLive(fold, events)`. A live fold always sees ephemeral events, so the `includeEphemeral` option is gone; use a projection for anything that does not need them. Live folds take an optional `shape` schema that infers their state type, and passing a projection where a live fold is expected is a type error.

Live folds no longer see ephemeral events from an effect attempt that the runtime retried, so streamed text from a failed attempt disappears without reducer code. `@swirls/looms/core` exports the rule as `dropSupersededAttempts(events)`, with `retriedEffectId(event)`.
