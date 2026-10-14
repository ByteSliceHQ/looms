---
'@swirls/looms': minor
---

Live folds no longer see ephemeral events from an effect attempt that the runtime retried, so streamed text from a failed attempt disappears without reducer code. `foldEvents` in `@swirls/looms/react` is now `foldLive(fold, events)`, which applies the same rule and drops the `from` argument.
