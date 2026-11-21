# @swirls/looms

## 0.24.0

### Minor Changes

- 162825e: The NATS projector can leave ephemeral events out of the stream: `natsProjector({ ephemeral: 'skip' })`. Ephemeral events take sequence numbers in a run's log, so a batch whose newest event is ephemeral ends with one cursor message on `<run's subjects>.looms.cursor`, carrying that sequence in `Looms-Seq` and `Looms-Cursor: true`. It replaces the run's earlier cursor, so a run holds at most one, and `position` and the hole check work as before. A reader of the stream skips it. The stream has to set `allow_rollup_hdrs`; a host transport is told which message replaces the earlier ones on its subject by `replaces` on the message. The default is unchanged: ephemeral events are stored, marked by `Looms-Ephemeral`.

## 0.23.0

### Minor Changes

- e8e38fd: Let the NATS projector reach a stream without a NATS connection, and file a run's subjects under its attributes. `natsProjector` takes a `transport` with two operations, the last message on a subject filter and an atomic commit that expects a stream sequence, so a host behind an HTTP bridge supplies its own; `natsConnectionTransport` is the one over a connection and is still what `connection` or `connect` gives you. `subjectAttributes` puts the named run attributes before the run id, `<prefix>.run.<attributes>.<runId>.<type>`, so a consumer filters one tenant's events on the server. `NatsProjectorSettings` no longer holds `stream`, `createStream` and `timeoutMs`: they are `NatsStreamSettings`.

## 0.22.1

### Patch Changes

- 9277d5f: A rebuilt Durable Object no longer drops a wake its alarm was holding. When an object was evicted with its alarm set for a wake owed now (from `launch` or a signal sent with `wake: 'schedule'`) or for a liveness deadline, and a request rebuilt it before that alarm fired, the new object replaced the alarm with the later deadline read back from run state, and the run sat until then. The alarm an object starts with is now kept until the runtime asks for a wake at or before it, or an alarm fires.

## 0.22.0

### Minor Changes

- a651e3b: `LoomsProvider`, `preloadRunStore` and `createLoomsStore` take `fetch`, `webSocket` and `grant`, so a page on another origin than its host can read a run: `fetch` adds the host's credentials to every HTTP request, and `grant` puts a run's read grant on the requests that read the log, the WebSocket included.

## 0.21.0

### Minor Changes

- cc734ac: Add `@swirls/looms/nats`, a projector that replicates committed events to a NATS JetStream stream. Each event goes to `<prefix>.run.<runId>.<type>` with the JSON envelope as the body and `Looms-*` headers. Batches are JetStream atomic batches fenced on the run's last stream sequence, so a batch lands whole or not at all, redelivery is a no-op, and `position` lets durable delivery rewind and refill a stream that fell behind. Requires nats-server 2.12 or newer.

## 0.20.0

### Minor Changes

- 8d7538f: Carry declared run attributes on every `looms_run_events` row. `postgresEventLog`, `postgresReplica`, and `sqliteReplica` now give the event table one text column per attribute passed as `additionalFields`, with the same name and `fieldName` rules as `looms_run_index`, so a host can put row-level security on both tables without a join. Each column comes with versioned migrations, `event_column_<name>` (which backfills existing event rows from `looms_run_index`) and, for `index: true`, `event_index_<name>` creating `looms_run_event_<name>`. `loomsRunEvents` from `loomsReplicaTables` and `looms replica generate --config` include them. Nothing changes when no attributes are declared.

  Breaking: hosts that declare attributes and run with `migrate: 'verify'` must generate and apply the new migrations before upgrading. Attribute columns may no longer use an event-table column name (`seq`, `event_id`, `ts`, `type`, `payload`, `thread_id`, `parent_thread_id`, `causation_id`, `effect_id`, `origin`, `idempotency_key`, `ephemeral`); set `fieldName` for those.

## 0.19.1

### Patch Changes

- 9f78e55: Keep `runSecrets` (and `readStream`) on event stores wrapped by `withProjectors`, `withBlobOffload`, and the testing fault injector, so a Durable Object configured with projectors can still provision and hand secrets to attempts instead of failing with "secrets are unavailable".

## 0.19.0

### Minor Changes

- eeebb6d: Move to Effect 4.1 and make `effect` a peer dependency (`^4.1.4`) instead of an exact dependency. Apps that use Effect themselves now share one copy with Looms instead of being forced onto Looms' exact version. Bun, npm, and pnpm install it automatically; Yarn users add `effect` themselves. `@effect/platform-bun` is now a caret range and `@effect/platform-node-shared` is no longer listed.

## 0.18.1

### Patch Changes

- 14bfc23: A wake that reaches `maxWakeIterations` no longer fails and leaves its run with nothing driving
  it. It starts nothing new, waits for the effects it already started, parks, and asks its
  scheduler to wake the run again at once, as the hosting guide describes. A long agent session
  whose workers kept calling tools could reach the limit inside one wake and then sit idle until
  an unrelated request woke it. `MaxWakeIterationsError` is no longer raised and is deprecated.

## 0.18.0

### Minor Changes

- e9f8f73: Decide what a run holds and what each attempt receives with a secret provider. Pass `secretProvider` to `createLooms`, `createRuntime`, an actor host, or the Cloudflare Durable Object. `provision` decides what a run holds when it starts, `forAttempt` decides what one attempt receives and can replace what the run holds, `forChild` decides what a launched or forked run is supplied with, and `revoke` is called when the run finishes. A `forAttempt` failure fails the attempt under its retry policy, and a worker that asks for its secrets is told `unavailable`. The observer is told `secrets.issued` and `secrets.failed`.

  `secretSealer({ key })` encrypts what a run holds before it is stored. Pass it as `secretSealer`.

  Breaking changes:

  - What a run holds is deleted when the run finishes.
  - A run launched from an effect, and a fork, no longer inherit the parent's secrets. Pass `secrets` on the launch or the fork, or return them from `forChild`. To keep the old behavior for launches, use `secretProvider: { forChild: ({ held }) => held }`.
  - `RunSecretStore` needs a `delete` method.
  - `EffectAdmissionContext.secrets` and `ctx.secrets` are the attempt's secrets, which differ from what the run holds when a provider has `forAttempt`.

## 0.17.0

### Minor Changes

- 00073ce: Open a run's store before its page renders. `preloadRunStore(runId, options)` from `@swirls/looms/react` works outside React, such as in a route loader, and resolves with the store once it has caught up to the log. Components that then call `useRunStore` for the same run get that store, already filled, so a page appears whole instead of connecting and replaying the log on screen. Pass it the same options the provider is given; `RunStoreOptions` names them. A `signal` stops the wait.

## 0.16.0

### Minor Changes

- 8775cea: `@swirls/looms/react` can keep a run's events on the device. Pass `cache={indexedDbEventCache()}` to `LoomsProvider`, or `cache` to `createLoomsStore`: the store keeps the run's durable events, starts from them the next time it opens, and downloads only what was appended since. Ephemeral events are never kept, and a cache that turns out to be ahead of the host's log is dropped. `EventCache` is the interface to implement for other storage, and `memoryEventCache()` is one for tests.

  The store also reports timings. Pass an `observer` to `LoomsProvider` or `createLoomsStore` to be told when a store has caught up (`store.synced`, with how long it took and how many events came from the cache), when its connection status changes, and how long each commit took to be acknowledged, confirmed, or to fail.

  Actor hosts and `LoomsDurableObject` accept the runtime's `observer`, so a run hosted in a cell or a Durable Object can report its wakes, appends, snapshots and effect attempts.

## 0.15.0

### Minor Changes

- 890bacc: `store.commit` in `@swirls/looms/react` can show its events before the host confirms them. Pass `{ optimistic: true }`, or set `optimistic` on `createLoomsStore`: the events are folded into projections and live folds at once, after every confirmed event, replaced by the host's copies when those arrive, and removed if the commit fails, in which case `commit` rejects. `store.pending()` lists the events still waiting and `isPendingEvent` identifies one. `commit` also takes an `idempotencyKey` and a `send` function for writes that go through a route of your own. Events decoded from the wire now keep their `idempotencyKey`, which is how a pending event is matched to its confirmed one.

  The store also reports when it has caught up: `store.synced()` and `useRunSummary(store).synced` are false until it holds everything the log had when it connected. `LoomsProvider` and `useRunStore` take `retainMs`, how long a store stays connected after its last component unmounts, and `useRunStore` and `createLoomsStore` take `fromSeq` to follow a run from a later point in its log.

- 890bacc: A signal can be answered as soon as its events are committed, without waiting for the run to finish acting on them. Pass `{ wake: 'schedule' }` to `signal` on the runtime, `createLooms`, an actor host or a Durable Object stub: it resolves once the events are on the log and leaves the wake to the scheduler, as `launchRun` does. Over HTTP, `POST /runs/:id/events` and `POST /runs/:id/signals/:namespace/:name` do the same when sent with `Prefer: respond-async` or `?respond=async`, and answer `202`. The `state` in that answer is the one the events were committed against; follow the event stream for what the run does next. `store.commit` in `@swirls/looms/react` now asks for this, so it resolves when the event is committed and no longer stays open for the length of an agent turn.

## 0.14.0

### Minor Changes

- 9e870dc: Agent messages can carry attachments: images, recordings, documents and other files. A message's `attachments` is a list of references (`id`, `mediaType`, and optionally `name`, `size` and `url`), so the event log never holds the bytes. `userMessage`, `steer` and agent session messages accept `attachments`, and an agent started with input shaped `{ text, attachments }` begins on a message that has them. `vercelLlm` takes a `resolveAttachment` option that reads an attachment's bytes for a model call; images are sent as image parts and everything else as file parts. An attachment the resolver returns `null` for is sent by its `url` when it has one and is named in the message text otherwise. Adapters that build their own model call can use `resolveAttachments` with `toModelMessages(messages, { attachments })`.

## 0.13.2

### Patch Changes

- 06942de: An in-process effect whose attempts keep being lost now fails instead of being re-attempted without limit. When a wake finds an attempt that an earlier wake started and never finished, because its process was lost or the wake failed, it still starts the next attempt, but only while attempts remain: up to the effect's `maxAttempts`, or three attempts when the effect has no retry policy. After that the effect fails with `attempt N was lost before it finished, and no attempts remain`. Attempts ended by a signal in the same wake, such as steering an agent, are not treated as lost.

## 0.13.1

### Patch Changes

- ab05943: A run on a Durable Object now recovers by itself when its isolate is lost while an in-process effect is running. Until now such a run had no alarm, so after an eviction, deploy, or crash mid-effect it stayed `running` until something signalled it. While a wake waits on in-process effects it now keeps the object's alarm about 30 seconds ahead and renews it; if the isolate goes away the alarm fires in a new one, the run wakes, and the effect is re-attempted as it already is on any later wake. `WakeScheduler` gains an optional `keepAlive` for hosts whose wakes outlive the process, and `livenessLeaseMs` sets the interval. Schedulers without `keepAlive`, including the default in-process one, behave as before.

## 0.13.0

### Minor Changes

- 70b0f88: Let `authorize` say who a request acts as, and decide in a Cloudflare Worker.

  - An allowed `AuthDecision` may carry `actorId` (`authAllowedAs(actorId)`). Events sent through
    `POST /runs/:runId/events` and named signals are then recorded with
    `origin: { type: 'external', actorId }`, replacing any origin the request claimed.
  - `RouteInfo` has `signal` (`namespace/name`) for named signal requests, so a policy can allow
    specific signals.
  - `describeRoute(method, pathname)` describes a request's Looms route without a runtime.
  - `routeToDurableObject` takes `authorize`, checked in the Worker before a request is forwarded. The
    actor it names reaches the Durable Object in a header clients cannot set; `forwardedActorAuth()`
    on the object records it.

## 0.12.4

### Patch Changes

- b8b1759: Count `maxTurns` per user message for conversational agents. The turn counter ran over the whole conversation, so a chat with `maxTurns: 3` failed with "Max turns exceeded" on its fourth reply. A conversational agent now counts model turns from its latest user message (or steer), so the limit bounds the work spent on one reply. Agents that are not conversational still count every turn of the run.
- b8b1759: Make `stopAgentTurn()` and an interrupting `steer()` abort the in-flight model call when sent without a thread id. The signal was recorded on the root thread, but the interrupt lookup only matched an explicit `threadId`, so the adapter's `signal` never aborted and the full reply was appended after the stop. A signal without a thread id now interrupts the root thread and its children, for conversational agents and agent sessions alike.
- b8b1759: Count `stopWhen` steps per user message for conversational agents. `stopWhen` received the thread's lifetime turn number, so `stepCountIs(8)` on a conversational agent stopped every turn after the eighth and dropped its tool calls. The `turn` passed to `stopWhen` now counts from the latest user message for a conversational agent, the same way `maxTurns` does. Other agents are unchanged.
- b8b1759: Keep text deltas that were streamed just before a turn was stopped. Live events are written in the background, and a wake whose only attempt was aborted released the run without flushing them, so a delta emitted moments before `stopAgentTurn()` could be missing from the log. The wake now flushes pending live events before it parks.
- b8b1759: Keep a run alive when a message follows a stopped agent turn. A model call that was stopped mid-stream could emit one more text delta after its turn was abandoned. That late write failed, and the failure stuck to the run, so the next turn's first `onTextDelta` threw "Cannot append live events without a store" and the run failed. Live events from an attempt that has been aborted or has finished are now dropped.

## 0.12.3

### Patch Changes

- 04d546e: `onEffect` and `onAdmit` accept an effect definition that requires host services. Wrapping `callLlmEffect` in middleware, as in `onEffect(callLlmEffect, handler)`, was a type error because the definition's service requirements did not match the parameter's default. The functions now infer those requirements from the definition.

## 0.12.2

### Patch Changes

- 19c5f76: Keep agent tool results next to their tool calls when a message arrives mid-call. A non-interrupt steer sent while a tool call was open was stored between the call and its result, and the next LLM turn failed with "Tool result is missing for tool call". Results are now inserted directly after the call, so the steer follows them.

## 0.12.1

### Patch Changes

- 4609a95: Keep handling signals while local effects are in flight. The wake loop forks each `(thread, causingSeq)` effect group and replans when a joined or coalesced signal arrives, so a long tool call on one thread no longer blocks intake, narration, or steers aimed at other threads.

## 0.12.0

### Minor Changes

- 76fd14d: Add commit-only start APIs parallel to the existing wake-waiting ones:

  |                            | Waits for first wake | Returns after commit |
  | -------------------------- | -------------------- | -------------------- |
  | Definition object          | `start`              | `launch`             |
  | `{ kind, definitionName }` | `startRun`           | `launchRun`          |
  | HTTP                       | `POST /runs`         | `POST /runs/launch`  |

  `launch` / `launchRun` / `POST /runs/launch` leave the first wake to the host's scheduler (the Durable Object alarm on Cloudflare). The runtime method stays `launchRun`; actor `cell.launch` is unchanged (cross-run launcher, returns void).

## 0.11.3

### Patch Changes

- 733514a: Cut cold Durable Object start-run latency: defer projector recover/deliver with `waitUntil`, skip `projector.init` when the log is empty or caught up, and add `migrate: 'auto' | 'verify' | 'skip'` so hosts that own Postgres DDL avoid per-run table locks.

## 0.11.2

### Patch Changes

- 58c214c: Rerun a conversational agent turn when a steer or user message arrives while the LLM call is in flight, so the late message is not lost after a final reply.

## 0.11.1

### Patch Changes

- 2ff6701: Wake idle agents on a non-interrupt steer. Queued steers still wait for open tool calls to finish, so in-flight work is not abandoned.

## 0.11.0

### Minor Changes

- 7f412db: Declare your own run attributes and give them replica columns, and clear Durable Object storage for terminal runs.

  **Breaking:** the replica and `postgresEventLog` no longer have built-in `tenant`, `project`, and `org` columns. Declare the attributes you need with `defineRunAttributes` and pass them as `additionalFields`:

  ```ts
  const attributes = defineRunAttributes({
    tenantId: { required: true, index: true },
  })

  createLooms({ modules, attributes })
  postgresReplica({ url, additionalFields: attributes })
  loomsReplicaTables({ additionalFields: attributes })
  ```

  - Each attribute is a text column named in snake_case unless `fieldName` is set. `index: true` adds an index. Each column and index is its own migration, and a new column is backfilled from the `attributes` JSON. `postgresEventLog` records these migrations in `looms_schema_migrations` and applies each one once.
  - Once attributes are declared, `start`, `startRun`, `launchRun`, and the client only accept declared keys, and `required` keys must be passed. The host refuses other starts with `InvalidRunAttributesError`, which `POST /runs` reports as 400.
  - `replica.purge({ finishedBefore, where })` filters on declared attributes.
  - `looms replica generate`, `migrate`, and `status` take `--config <module>` to read the declaration.
  - `deleteTerminalRunStorage` deletes a terminal run's Durable Object storage once the listed projectors attached to the object have caught up.

  Replicas created by an earlier version keep their `tenant`, `project`, and `org` columns, and Looms stops writing them. On Postgres, declaring an attribute with one of those column names reuses the column. On SQLite, use another `fieldName` or drop the old column first.

## 0.10.0

### Minor Changes

- ddcb70f: Schema-first signals: declare builders with `m.signal` / `defineSignal`, publish and run them over HTTP, and use a schema-aware debugger signal picker. Built-in signal helpers take object input. Modules also publish a description and keep signals, steps, and example traces as first-class members.

## 0.9.0

### Minor Changes

- f6e2758: Add `sqliteReplica` for a shared SQLite or Cloudflare D1 copy of every run. `looms replica` takes `--dialect sqlite`.

## 0.8.0

### Minor Changes

- ef94314: A Postgres replica copies every run into a database you own. `postgresReplica` stores the full event envelope, folds the run summary in the same transaction, and records `replicated_seq` only through a contiguous prefix, so a restored database or a replica attached mid-run catches up instead of leaving a hole. `status` reports whether that copy is complete. `purge` deletes event copies for finished runs and later deliveries skip them.

  `looms replica generate` writes the versioned SQL into your migration folder (and a Drizzle journal, when you ask). `looms replica migrate` applies it. `@swirls/looms/replica/drizzle` exports the tables, and `loomsReplicaTables` adds columns your application owns.

## 0.7.0

### Minor Changes

- f2bef2f: Effects declare `placement: 'local' | 'worker'` on `m.effect`, `scope.effect`, or `defineEffect`. Local effects require `execute`; worker effects forbid it and implement the handler with `workerHandlers`. Queue routes take worker definitions, local and worker handlers get distinct context types, and `defineModule` rejects effects built outside the module's catalog. `GET /definitions/effects` publishes each declared effect, including placement, retry policy, and input schema.

## Unreleased

### Minor Changes

- **Breaking:** Effect placement is explicit. `m.effect`, `scope.effect`, and `defineEffect` require `placement: 'local' | 'worker'`. Local effects must define `execute`; worker effects must not, and their handlers go in `workerHandlers`. Worker definitions no longer carry a no-op `execute`, and `hasHandler` is removed; branch on `placement` instead. The old inferred `execution` / handler-less / string-`handles` overlap model is removed. `cloudflareQueueWorker` routes take `{ effects: [definition], queue }` instead of `handles` type strings. `onEffect` only accepts local definitions; `workerHandlers` only accepts worker definitions. Handlers receive `LocalEffectContext` or `WorkerEffectContext` (`placement` discriminant); worker `emit` stays buffered until complete.
- **Breaking:** `defineModule` rejects effects whose events fall outside the module's catalog and `observes`, such as an effect built with another module's scope or an unscoped `defineEffect` that returns untyped events. Build effects that live in their own file with `createModuleScope(...).effect`.
- Effect admission hooks (`admission` / `onAdmit`) run in the host before every local attempt and before every worker dispatch, so credit checks and feature flags cover both paths. `failEffect` from admission becomes `runtime.effect.failed`; a rejected worker admission never queues. Execution middleware remains local-only.
- `onAdmit` and `onEffect` decode the input with the definition's schema before the hook runs, so hooks see defaults and transforms. An input that fails to decode fails the attempt.
- Queue tasks carry `threadId`, `causingEventId`, and `attributes`. Secrets load through the worker callback before the handler runs. `GET /definitions/effects` lists declared effects, including placement, retry policy, and input schema. `runtime.effectPlacements` lists placements; `inspectRun` / effect status includes each outstanding effect's `placement`.
- Creating a runtime fails when worker-placed effects have no `EffectWorker`, or when a worker claims a local-placed effect type.
- Unacknowledged worker dispatch failures no longer park as `ambiguous` on the first push. The attempt enters `dispatch_wait` via `runtime.effect.dispatch.deferred`, and the wake engine retries the same attempt with dedicated outbox backoff. `ambiguous` remains for missing workers, cancellation timeouts, and exhausted relays. Acknowledged transports (Cloudflare Queues) are unchanged. `retryEffect` can target `dispatch_wait`.

## 0.6.1

### Patch Changes

- 979055d: Fix a wake-loop spin that failed a run with `MaxWakeIterationsError` whenever a workflow node finished while a sibling node was still busy (an effect in `retry_wait`, a sleep, or a child wait) and nothing else was runnable. The workflow scheduler legitimately returned no events in that situation, but the local executor recorded the empty result as a failed attempt (`empty-outcome`), and because an untagged effect takes its id from the event that caused it, the failure event re-derived an identical scheduler effect under a new id, over and over. An effect handler that returns no events is now recorded as `runtime.effect.completed`, matching the worker path, and the fold no longer re-issues an untagged effect that the completion event itself would reproduce unchanged; any later event for the thread still re-derives it with a fresh id. Parallel root nodes no longer need to be serialised into a dependency chain to survive a retry.

## 0.6.0

### Minor Changes

- 1b27d12: Effect middleware can call `failEffect` and have it become `runtime.effect.failed` instead of failing the wake. `onEffect` wraps middleware for one effect definition with a typed input. Docs cover middleware scope (local effects only) and the `tokenUsage` / `agent.turn.usage` projection path for billing.

### Patch Changes

- 5d0b988: Fix 0.5.x durability gaps: cancel launched children before recording close.requested; prime definition resolvers from snapshots; resolve relative WebSocket bases; filter SSE by threadId/includeEphemeral; write filesystem blobs atomically and repair corrupt digests; require start-to-close or heartbeat timeouts for acknowledged workers and retry lost terminal queue callbacks; clear workflow wait-child pending state on node finish.

## 0.5.2

### Patch Changes

- a51bc1a: Allow Durable Object hosts to pass an `EffectWorker` through `LoomsDurableObjectConfig.worker` so queue-routed effects can leave the cell.

## 0.5.1

### Patch Changes

- 86280a0: Export `@swirls/looms/cloudflare/queues` so Bun/Node pull consumers can load queue helpers without importing `cloudflare:workers`.

## 0.5.0

### Minor Changes

- edd3c5c: Agents gain structured output through a `submit_output` tool, one compaction-and-retry when the model reports a context overflow, `resolveTools` for tools that depend on the agent input, an `assertCredits` gate before each model call, and `trackUsage` beside a new `agent.turn.usage` event. Team members spawned with `asAgentTool` stop at `TEAM_MEMBER_MAX_DEPTH` (3); the parent sends the child its depth with a new `agent.lineage` event.
- 0ac83ab: `createLooms({ blobStore })` and `LoomsDurableObject` `blobs` store strings over 64 KiB by SHA-256 and keep a reference in the event or snapshot. A payload that is still over the 1 MiB event limit is stored as one blob. Reads, subscribers, folds, projections, and snapshot loads resolve the reference, so a run can complete with a payload larger than that limit. Trim removes a blob body once nothing retained still points at it. `memoryBlobStore`, `filesystemBlobStore`, and `r2BlobStore` are the included stores. Without a blob store, events over 1 MiB and snapshots over 8 MiB are still rejected.
- 0ac83ab: feat(runtime)!: launch workflow children as their own runs

  A workflow can set `childExecution: 'run'` so spawn, map, fanout, and loop start a child run instead of a thread. The child run id is stable across retries. When the child finishes it signals `runtime.child.settled`, which completes the parent's wait. `childClose` is `terminate` or `wait`. The default remains in-process threads.

  BREAKING CHANGE: `RunLauncher` implementations must provide `signal` and `cancel`.

- 0ac83ab: Definitions can be loaded at start, spawn, and recovery through `definitionResolver`, with registered definitions checked first and an LRU cache in front. A missing definition fails the start before any event is written, and the accepted version stays pinned on the run. Evaluator definitions now include `version`, defaulting to `v1`, and lookup takes the name and version.

  BREAKING CHANGE: `EvaluatorDefinition` requires `version`, and evaluator lookup is `(name, version)` instead of `(name)`. `defineEvaluator` still defaults the version to `v1`.

- 2436516: Worker callbacks now answer `{ status: 'accepted' | 'stale' | 'cancelled', cancelRequested }` instead of the run state. `createLooms().workerCallback` and `createLoomsClient().workerCallback` return that result. `cancelRequested` tells an attempt that is already running to stop, because a dispatch that has left the host cannot be recalled. A stale report records nothing.

  `failEffect({ error, nonRetryable, retryAfterMs })` fails the current attempt. `nonRetryable` ends the effect even when the retry policy has attempts left. `retryAfterMs` waits at least that long before the next attempt and never shortens the policy backoff. Worker `fail` callbacks take the same two fields.

  A heartbeat may include `details`. The latest details are kept across retries and included on the next `EffectWorkerTask`, so a resumed attempt can continue from the recorded progress.

- 0ac83ab: Durable Objects accept a hibernating WebSocket on `GET /runs/:id/events`. The socket replays the retained log, then receives later events without a subscription held in memory. SSE sends the same `hello` and `resync` frames. A cursor below the retained head is told to resume from `head` instead of silently skipping trimmed events. `subscribeEvents` and the React store take `transport: "websocket" | "sse" | "auto"`; the default remains SSE, and a numeric reconnect delay still works.
- c01d046: A run started from an effect through `RunLauncher` now records its source on `runtime.run.started`. The payload's `launchedBy` holds the launching run, thread, and effect, plus the id and seq of the event that requested the effect. The event's origin is `{ type: 'run', runId }`, and its `correlationId` names the root run of the launch chain. The runtime sets these fields itself and replaces any value a handler passes. `RunState.startIdentity` exposes both fields, and a later start of the same run id that does not match them rejects with `StartRunConflictError`.

  The launching run's log gets a new `runtime.run.launched` event for each start the target accepts. It carries the started run's id and definition plus the effect id, so listing what a run launched reads that run's log alone.

  The index projectors store `launchedByRunId`, `launchedByEffectId`, and `correlationId` on run rows, and `listLaunched(runId)` returns the runs a run launched. Their version is now 3, so delivery replays history to fill the new columns, and `init` adds the columns to existing SQLite and Postgres tables.

  `useRunSummary` returns `launchedBy`. The debugger shows a Launched by link above the thread tree that opens the launching run at the requesting event, the event inspector links `runtime.run.launched` and `runtime.run.started` to the run on the other side, and `openRun` accepts a `{ seq }` target.

- 0ac83ab: Runs carry the caller's W3C trace context. `POST /runs` reads the `traceparent` and `tracestate` headers, and `start`, `startRun`, and `client.startRun` accept `trace`. A valid context is recorded on `runtime.run.started` and `startIdentity.trace`, then passed unchanged to effect handlers (`ctx.trace`), worker tasks (`task.trace`), and every launched or child run unless the launch sets its own.
- a1fa2c3: feat(projectors): project runs into a Postgres event log without blocking append

  Durable Object projectors are scheduled with `waitUntil` after the log commits. `postgresEventLog` stores each non-ephemeral envelope and a run index with status, launch links, and tenant attributes, and can rebuild that sink from the log.

- 0ac83ab: feat(cloudflare): run worker effects over Cloudflare Queues

  `cloudflareQueueWorker` sends each attempt to a queue as JSON, with the run's trace context and the attempt's deadlines; inputs over 100 KB travel as a blob reference and secrets stay off the queue. `queueConsumer` (push) and `createQueuePullConsumer` with `cloudflareQueuePullSource` (HTTP pull) run handlers that heartbeat, read secrets through the worker callback API, and stop when the run is cancelled. The consumer acks after `started`, so Looms owns retries; duplicate and stale deliveries are dropped, and dead-lettered messages are recovered by the schedule-to-start timeout. The pull consumer batches acks, backs off when idle, reports the backlog, and drains on `stop()`. `createMemoryQueue` gives tests the same lease and dead-letter behavior.

  In the runtime, `EffectWorker.dispatchSemantics: 'acknowledged'` fails a rejected dispatch under the retry policy instead of parking it as ambiguous, and creating a runtime fails if such a worker claims an effect without `retry.scheduleToStartTimeoutMs`. Worker tasks carry `deadlines`, and `maxInFlightWorkerEffects` caps the worker attempts one run has in flight.

- 0ac83ab: Runs accept immutable `attributes` and a `secrets` context. Attributes are recorded on `runtime.run.started`, the run state, and the run summary, and are passed to `authorize` when present. Secrets stay in a side store: they are available to effect handlers and in-process worker dispatch, and they are not written to events, snapshots, or run responses. A worker whose transport persists tasks reads them with `POST /runs/:runId/effects/:effectId/:attempt/secrets` (`client.workerSecrets`), which only answers the attempt that is currently running.
- 0ac83ab: feat(runtime): authorize browser event streams with a signed run grant

  `grantAuth` checks a short-lived HMAC grant from the `grant` query parameter or a `v1.` WebSocket subprotocol. The grant allows one principal to read one run, which is the credential a browser can send on EventSource or WebSocket. The Durable Object socket echoes a subprotocol grant on the upgrade, and `grantSubprotocol` gives other hosts the value to echo.

- c01d046: Add a schedule module so a cron, interval, or one-shot time can start a run, and so a deploy can update, pause, or retire that schedule without a new run id.
- 0ac83ab: feat(testing): replay recorded run logs in CI and document effect contracts

  Adds a production-shaped event-log corpus under `packages/testing/corpus`, folded
  deterministically in CI with `assertCorpusEntry`. Documents versioning effect
  types (`payments.charge@v2`) and worker `handles` so fleets can roll out beside
  each other without Temporal-style patches.

## 0.4.0

### Minor Changes

- 46be9ee: `LoomsRegister`, `RegisteredEvent`, and `AnyEventEnvelope` now live in `@swirls/looms/core`; `@swirls/looms/react` re-exports them, so existing `declare module '@swirls/looms/react'` registrations keep working. Standalone `defineProjection` reducers receive the registered event union, so client-only projections are typed without annotations. Registered event payloads were previously typed as `any`; they now carry their catalog types, so code that relied on `any` may need to narrow on `event.type` first.
- 46be9ee: `createFold`, `useEventFold`, `EventFoldDefinition`, and `foldEvents` in `@swirls/looms/react` are now `defineLiveFold`, `useLiveFold`, `LiveFoldDefinition`, and `foldLive(fold, events)`. A live fold always sees ephemeral events, so the `includeEphemeral` option is gone; use a projection for anything that does not need them. Live folds take an optional `shape` schema that infers their state type, and passing a projection where a live fold is expected is a type error.

  Live folds no longer see ephemeral events from an effect attempt that the runtime retried, so streamed text from a failed attempt disappears without reducer code. `@swirls/looms/core` exports the rule as `dropSupersededAttempts(events)`, with `retriedEffectId(event)`.

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
