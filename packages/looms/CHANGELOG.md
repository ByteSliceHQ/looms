# @swirls/looms

## 0.0.2

### Patch Changes

- 9f3fd62: Include the package changelog in published npm artifacts.

## 0.0.1

### Patch Changes

- e83496a: **BREAKING**: Modules own their definitions. Pass `workflow({ definitions: [checkout] })` / `agent({ definitions: [...] })` instead of a top-level `definitions` list on `createLooms`, `createRuntime`, actor cells/hosts, or Durable Objects. Omitting `modules` installs none (no longer defaults to agent/workflow/approval).

  **BREAKING**: `defineModule(options, setup)` returns the finished module. Returned `effects` / `threads` / `projections` / `definitions` are registered and exposed (e.g. `payments.effects.charge`). The old scope-only + `.build()` form is replaced by `createModuleScope` for multi-file authoring.

  Compose rejects duplicate definitions and definitions whose owning module does not implement the thread kind. Starting or spawning an unsupported kind fails before run events are written; folding an unsupported kind marks the thread failed instead of inventing empty state.

- ee5f92f: Initial 0.0.1 OSS release: durable Effect runtime for agents and workflows, S2 adapter, HTTP client, React bindings, CLI, optional projectors, and demo app.
- 4c8410e: Looms DX overhaul:

  - Add Standard Schema `input` typing and runtime validation for `defineAgent`, `defineWorkflow`, and `defineTool`.
  - Provide Promise-based `createLooms()` facade with lazy init, typed start overloads, and universal `fetch(req) -> Response | null`.
  - Add Looms-native event streaming directly against EventStore and `/api/events` (eliminating the dual-log S2 bridge).
  - Add `s2Lite()` / `startS2Lite()` auto-starting dev process manager.
  - Typed client generics for `createLoomsClient<typeof definitions>()`.
  - Single server setup for dev and prod in demo app with no `effect` dependency.

- 4c8410e: Introduce the generic `@swirls/looms/projectors` module. Implement `Projector` or use `memory()`,
  `postgres({ url })`, and `sqlite({ path })`. `createLooms({ projectors })` initializes projectors,
  wraps append, and disposes them. S2 helpers now take an explicit environment bag; `serveHttp` no
  longer reads `PORT`.
- f1cceb0: Optimize React SDK and Debugger for high-velocity event streaming:

  - **BREAKING (`@swirls/looms/react`)**: `useRunStore(runId, options)` is now a non-subscribing handle. Subscribe via fine-grained hooks (`useProjection`, `useRunEvents`, `useRunSummary`, `useThreadTree`, `useEventCounts`, `useEventBySeq`, `useLatestEvent`, `useEventFold`, `useRunSelector`). Removed `createLoomsHooks` and `pollIntervalMs` — use `LoomsRegister` or explicit `EventsOf<…>` generics instead.
  - **BREAKING (`@swirls/looms/react`)**: Materialized tables no longer include `events_log`; the event log lives only in `store.events()` / `EventIndex`. `StoreListener` is now `() => void` (re-read via store APIs).
  - **Incremental Projection Caching (`@swirls/looms/react`)**: `store.project(def)` and `useProjection` fold newly arrived events from cached state (O(batch)), preserving references when unchanged.
  - **Adaptive Coalescing (`@swirls/looms/react`)**: Default `coalesce: 'adaptive'` (macrotask when quiet, animation-frame under burst); also `frame`, `immediate`, `{ delayMs }`. Notify scheduling lives in `createNotifyScheduler`. Added `store.flush()`.
  - **Shared `EventIndex` (`@swirls/looms/core`)**: Append-only thread/seq/count/latest indexes with lazy snapshots; used by the React client store and the debugger.
  - **Debugger (`@swirls/looms/debugger`)**: Virtualized `EventStream` with stable default catalog, catalog-aware meta cache, and `useMemo` visibility filtering.

- e398380: Publish the React integration at `@swirls/looms/react` and drop the former LiveStore protocol names.

  - Package and React provider are now `@swirls/looms/react` / `LoomsProvider`.
  - Live event HTTP is `GET /api/events?runId=` (pull or SSE). Wire batches are Looms event envelopes.
  - `LiveStoreGlobalEncoded` is now `EncodedLoomsEvent`.
