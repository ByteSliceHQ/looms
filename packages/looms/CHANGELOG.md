# @swirls/looms

## 0.3.0

### Minor Changes

- 331ff55: `stopAgentTurn()` builds an `agent.turn.stopped` signal that ends the turn in progress without ending the run. A conversational agent aborts its in-flight model call or tool, cancels child threads its tool calls started, answers open tool calls with a stopped result, and waits for the next message. An agent session cancels its active turn and stays open. The debugger chat shows a Stop button while a turn is running.

  An interrupting `steer` now ends the turn the same way before it starts the next one, so it no longer leaves tool calls unanswered or tool children running.

  Cancelling a thread now cancels every live thread below it, and a signal interrupt also aborts in-flight work in the named thread's descendants.

  The new `turnActivity` projection reports whether the root agent thread has a turn in progress.

- 8da450e: `POST /runs/:id/cancel` and `client.cancel(runId, threadId?)` cancel a run or thread over HTTP. The debugger's Cancel button now uses it, so cancelling an in-flight agent turn stops the run instead of retrying the turn. Cancel stays available while a wake is running. `POST /runs/:id/wake` and `client.wake()` return `appended`, the number of events the run gained during the wake, and the debugger's Wake button reports it. Client run tables, the debugger, and projector indexes now mark a cancelled run as `cancelled` instead of `running`, and projector indexes mark a run that completed with an error as `failed` instead of `completed`. `RunRow.status` and `RunSummary.status` are typed as `RunStatus`, and `completedRunStatus()` reads the outcome of a `runtime.run.completed` payload.

  Signals sent to a completed, failed, or cancelled run now reject with `RunTerminalError` (HTTP 409) instead of being appended and ignored. Retrying a signal whose `idempotencyKey` was already accepted still succeeds. `useRunSummary` exposes `finished`, and the debugger disables the agent follow-up composer and approval decisions on finished runs.

- 6230fe1: `looms.fork(runId)`, `POST /runs/:id/fork`, and `client.fork()` start a new run that continues where a failed or cancelled run stopped. The fork copies the source's history up to the point it finished, keeping thread ids and sequence numbers, records `runtime.run.forked`, and re-issues the effects outstanding there. A cancelled agent re-runs the model call the cancel cut off; a failed run retries the effect whose failure ended it. Effects can declare `deterministic: true` so a fork retries the work behind them instead; workflow scheduling does. Forking a missing run rejects with `RunNotFoundError` (404 over HTTP). Actor and Durable Object hosts return 501. The debugger shows Continue on failed and cancelled runs, and `useRunSummary` reports `resumable` for them.

  `runtime.thread.cancelled` records `resumeSeq` on the thread a cancel targeted: the run's last seq before the cancellation began.

- 275e6a8: The projector index is keyed by run, so runs that share thread or approval ids stay apart. `getActor(runId, actorId?)` returns the run row by default or one of its threads, review rows carry `runId` instead of `actorId`, and the tables are now `looms_run_actors` and `looms_run_reviews`. The built-in index projectors moved to version 2, so delivery rebuilds them; the old `looms_actors` and `looms_reviews` tables are no longer written.

## 0.2.0

### Minor Changes

- 6ed3a5f: `vercelEvaluator({ provider, model })` resolves model ids through an AI SDK provider such as `createTypeSafeAi({ apiKey })`, so callers can use their own TypeSafe key instead of the AI Gateway.
- 6ed3a5f: Serve a debugger UI from `createLooms` with `debuggerUi()` from `@swirls/looms/debugger/server`. Modules ship their own debugger views from `@swirls/looms/agent/debugger`, `@swirls/looms/workflow/debugger`, and `@swirls/looms/approval/debugger`. `GET /definitions` lists the definitions and projections that UI can start and inspect, and `GET /runs/summaries` returns each run's status and definition.

  `@swirls/looms/debugger` also exports the building blocks the hosted UI uses, so module views can match it: `JsonTree` (collapsible JSON that expands JSON held in strings), `FollowList` (a virtualized list that follows new items), `Composer`, `Button`, `Input`, `Textarea`, `Select`, `PanelHeader`, `PanelTitle`, `EmptyState`, `Kbd`, and `StatusBadge`. To render `DebuggerShell` in your own app, import `@swirls/looms/debugger/styles.css` after Tailwind CSS v4. The stylesheet brings its theme and scans the kit and the built-in module views.

  Breaking changes:

  - Tool helpers and tool definitions no longer accept `inputSchema`. Pass `input` and the JSON Schema is derived from it.
  - `@swirls/looms/debugger` no longer exports `EventFamily`, `DEFAULT_FAMILIES`, `familyClass`, `familyFromPrefix`, `summarizeDomainEvent`, `summarizeEvent`, `searchText`, or `createDefaultCatalog`. Build a catalog with `createEventCatalog(plugins)` or use `defaultEventCatalog`.
  - `EventStreamCatalog.familyClass` is now `familyColor`, which returns a CSS color, and `searchText` is required.

## 0.1.0

### Minor Changes

- 2176eac: Add `defineKind` and `createKind` so custom startable types share the same `{ kind, name }` builder as `defineAgent` and `defineWorkflow`.
- a879e8b: Add `@swirls/looms/evaluator` so typed questions can score a run and branch a workflow. Pass a model id such as `typesafe-ai/jev`; the thread kind stays `evaluator`.

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
  - Add Looms-native event streaming directly against EventStore and `/runs/:id/events` (eliminating the dual-log S2 bridge).
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
  - Live event HTTP is `GET /runs/:id/events` with SSE content negotiation. Wire batches are Looms event envelopes.
  - `LiveStoreGlobalEncoded` is now `EncodedLoomsEvent`.
