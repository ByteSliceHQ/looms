---
'@looms/react': minor
'@looms/debugger': patch
'@looms/core': minor
---

Optimize React SDK and Debugger for high-velocity event streaming:

- **BREAKING (`@looms/react`)**: `useRunStore(runId, options)` is now a non-subscribing handle. Subscribe via fine-grained hooks (`useProjection`, `useRunEvents`, `useRunSummary`, `useThreadTree`, `useEventCounts`, `useEventBySeq`, `useLatestEvent`, `useEventFold`, `useRunSelector`). Removed `createLoomsHooks` and `pollIntervalMs` — use `LoomsRegister` or explicit `EventsOf<…>` generics instead.
- **BREAKING (`@looms/react`)**: Materialized tables no longer include `events_log`; the event log lives only in `store.events()` / `EventIndex`. `StoreListener` is now `() => void` (re-read via store APIs).
- **Incremental Projection Caching (`@looms/react`)**: `store.project(def)` and `useProjection` fold newly arrived events from cached state (O(batch)), preserving references when unchanged.
- **Adaptive Coalescing (`@looms/react`)**: Default `coalesce: 'adaptive'` (macrotask when quiet, animation-frame under burst); also `frame`, `immediate`, `{ delayMs }`. Notify scheduling lives in `createNotifyScheduler`. Added `store.flush()`.
- **Shared `EventIndex` (`@looms/core`)**: Append-only thread/seq/count/latest indexes with lazy snapshots; used by the React client store and the debugger.
- **Debugger (`@looms/debugger`)**: Virtualized `EventStream` with stable default catalog, catalog-aware meta cache, and `useMemo` visibility filtering.
