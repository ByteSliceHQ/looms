---
'@swirls/looms': minor
---

Open a run's store before its page renders. `preloadRunStore(runId, options)` from `@swirls/looms/react` works outside React, such as in a route loader, and resolves with the store once it has caught up to the log. Components that then call `useRunStore` for the same run get that store, already filled, so a page appears whole instead of connecting and replaying the log on screen. Pass it the same options the provider is given; `RunStoreOptions` names them. A `signal` stops the wait.
