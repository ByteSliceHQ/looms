# Production operations

## Guarantees and boundaries

Looms guarantees deterministic replay of retained events, optimistic append
conflict detection, idempotent ingress when a key is supplied, and at-most-one
in-process wake per run. It does **not** provide exactly-once external effects.
Use idempotency keys at the effect destination.

Cloudflare Durable Objects serialize requests for one object and commit SQLite
transactions atomically. Alarms are durable but may fire late and can be
coalesced. A deployment, eviction, or alarm retry may repeat a wake; event
preconditions make that safe. Cross-object queries and transactions are not
provided. Build global run lists with a projector.

An in-process effect has no deadline of its own, so while a wake waits on one
it keeps the object's alarm a short time ahead (`livenessLeaseMs`, default 30
seconds) and renews it every third of that. If the isolate is evicted,
redeployed, or crashes mid-effect, the alarm fires in a new isolate and the run
wakes and re-attempts the effect, as it does on any wake that finds an attempt
still open. The re-attempt is not counted against the effect's `maxAttempts`,
so an effect that takes its isolate down every time is retried at that interval
until the run is cancelled. This costs one or two alarm writes per wake that
runs an in-process effect. Other hosts opt in by implementing
`WakeScheduler.keepAlive`; the default in-process scheduler does not, because
its timers are lost with the process.

On a Durable Object, projector delivery is scheduled with `waitUntil` after the
append commits, so projector latency is not part of the run step. The cursor is
durable. A delivery that fails, or an isolate that stops before `waitUntil`
finishes, is retried on the next alarm or request.

Cold cell creation uses the same pattern. Projector `recover` and `deliver`
(and therefore `projector.init`, which may open Hyperdrive and apply schema)
are scheduled with `waitUntil` before the first request handler runs. Alarm
delivery is also deferred with `waitUntil`, so timer wakes are not blocked on
Postgres. Delivery still serializes per run and projector; empty and caught-up
logs skip `init` entirely. Hosts that already apply Looms DDL out of band
(for example with drizzle) should pass `migrate: 'verify'` or `migrate: 'skip'`
to `postgresEventLog` / `postgres` so init never takes table locks.

`postgresEventLog` is the generic sink: one row per non-ephemeral envelope,
keyed by `(run_id, seq)`, and a `looms_run_index` row with status, timestamps,
the parent run, the launching effect, and the run's attributes as JSON. Pass
`additionalFields` (see [Run attributes](#run-attributes-and-secret-context)) to
copy declared attributes into their own columns, so row-level security can use
them:

```ts
const attributes = defineRunAttributes({ tenantId: { required: true, index: true } })
postgresEventLog({ url, additionalFields: attributes })
```

```sql
ALTER TABLE looms_run_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON looms_run_index
  USING (tenant_id = current_setting('looms.tenant_id', true));
```

Pass Hyperdrive's connection string as `postgresEventLog({ url })`. Each
delivered batch is one transaction of about three statements, however many
events and runs it holds: one multi-row event insert per 1,000 events, one
run-index upsert, and one update for runs that only gained events. Writes are
idempotent. `rebuild(source)` replays a run from seq 1; run that while live
delivery is paused, then let the cursor catch up. Ephemeral events are left out
of the log.

Live subscribers on a Durable Object should open a WebSocket (`Upgrade: websocket` on `GET /runs/:id/events`). The object hibernates the socket, answers `ping` with `pong` without waking, and fans out events when the log is appended. SSE stays available, including on `looms.serve`, but its keepalive keeps a Durable Object awake. Writes stay on HTTP. A browser cannot send `Authorization` on the upgrade, so pass a read grant (see `grantAuth` below); `@looms/client` puts `grant` on the socket URL. An idle-socket billed-duration check on a real Cloudflare account has not been run.

A workflow can launch children with `childExecution: 'run'`. Each child is its own run, addressed by a deterministic id, and reports `runtime.child.settled` back to the parent. Cancelling the parent cancels those children. `childClose: 'wait'` records `runtime.child.close.requested` and cancels the parent only after the children reach a terminal status. `childClose: 'terminate'` cancels them as the parent closes. Children stay threads in the parent run unless `childExecution` is set.

All built-in stores reject an event over 1 MiB and a snapshot over 8 MiB,
measured as serialized UTF-8, before storage is mutated. The stable error names
are `EventPayloadTooLargeError` and `SnapshotPayloadTooLargeError`.

Pass `blobStore` to `createLooms`, or `blobs` to `LoomsDurableObject` /
`durableObjectEventStore`, to keep larger JSON. Strings over 64 KiB are replaced
with `{ "$looms": "blob", "sha256", "bytes", "mediaType": "application/json" }`
before those limits run. That object is reserved in stored JSON. If an event is
still over 1 MiB, its payload is stored as one blob. The body is SHA-256
content, so identical JSON is stored once. `read`, live subscribers, folds,
projections, and snapshot loads resolve references, including references nested
inside another blob. Objects and arrays stay inline so snapshot state still
decodes; a snapshot that is over 8 MiB after large strings are removed is still
rejected. Trim deletes a body when no retained event and no latest snapshot in
any run still needs it. Without a blob store, oversized events and snapshots
are still rejected.

`memoryBlobStore` is the in-memory implementation. `filesystemBlobStore(directory)`
is the Bun and Node implementation. `r2BlobStore(bucket)` writes an R2 bucket
under `looms/blobs/`. Every run's Durable Object can share one bucket. Each run
writes a marker per body it references, so trimming one run checks only that
body's markers, never other runs' logs. If a body is deleted while another run
is referencing it, that run's append fails and its retry uploads the body again.

## Run attributes and secret context

`attributes` on `start` are immutable string labels, such as a tenant or project
id. They are written on `runtime.run.started`, folded into run state, and copied
onto the run summary. Authorization receives them on `route.attributes` when a
run has any. They must be safe for every reader of the run. A launched run or a
fork inherits its parent's attributes.

Looms has no built-in attributes. Declare yours once with `defineRunAttributes`
and pass the same object to the host, the client, and the replica:

```ts
// looms.attributes.ts
import { defineRunAttributes } from '@swirls/looms'

export const attributes = defineRunAttributes({
  tenantId: { required: true, index: true },
  project: { index: true },
  region: { fieldName: 'home_region' },
})
```

```ts
const looms = createLooms({ modules, attributes })
await looms.start(billing, input, { attributes: { tenantId: 'acme' } })

const client = createLoomsClient({ baseUrl, attributes })
const replica = postgresReplica({ url, additionalFields: attributes })
const tables = loomsReplicaTables({ additionalFields: attributes })
```

Once attributes are declared, `start`, `launch`, `startRun`, `launchRun`, and the client
only accept declared keys, and a start without a `required` key is a type error.
The host checks the same rules at runtime and refuses a start with
`InvalidRunAttributesError`; `POST /runs` answers 400 with the `issues`.
Without a declaration, any string attributes are accepted.

In a replica or `postgresEventLog`, each declared attribute is also a text
column on `looms_run_index`, named in snake_case (`tenantId` becomes
`tenant_id`) unless `fieldName` is set. `index: true` adds
`looms_run_index_<column>`. Each column and index is its own migration
(`column_tenant_id`, `index_tenant_id`), and adding a column backfills it from
the `attributes` JSON of runs already copied. `postgresEventLog` applies these
migrations itself on `init` and records them in `looms_schema_migrations`, so
the backfill runs once. The replica applies them when `migrate` is `auto`, or
refuses to start until they exist when it is `verify`. The Drizzle table
exposes the column under the attribute key, for example
`tables.loomsRunIndex.tenantId`. Pass the declaration to the CLI with
`--config` so generated migrations match:

```sh
looms replica generate --out drizzle --config ./looms.attributes.ts
```

`secrets` are bearer material for the run. The memory and SQLite stores keep
them in a side table, `looms_run_secrets`, which is not part of the event log
or a snapshot. Effect handlers read them on `ctx.secrets`. An in-process worker
receives them on the dispatch task. A transport that persists that task must
omit `secrets`. Its worker reads them with
`POST /runs/:runId/effects/:effectId/:attempt/secrets` (`client.workerSecrets`)
after its `started` callback is accepted. The route uses `worker` access, so it
returns 503 until the host configures worker auth. It answers
`{ status: 'accepted', secrets }` only while that attempt is started and
unsettled, and `{ status: 'stale' }` or `{ status: 'cancelled' }` otherwise.
Responses are sent with `cache-control: no-store`. A handler must not copy
secrets into an emitted event.

A retry of the same start may omit `secrets` and keeps the stored context. Sending
a different context conflicts, and the error does not include the secret values.
Forks and effect-launched runs inherit the parent's attributes and secrets.
A store without `runSecrets` rejects a start that supplies secrets.

## Trace context

`POST /runs` reads the W3C `traceparent` and `tracestate` headers. In process,
pass `trace: { traceparent, tracestate }` to `start` or `startRun`, and
`client.startRun({ trace })` sends it as those headers. A valid version-00
`traceparent` is recorded on `runtime.run.started` and folded into
`startIdentity.trace`. Anything else is dropped, and so is a `tracestate` over
512 characters. It is not part of the start identity, so a retry from another
trace returns the same run.

The run's trace context is passed unchanged to every effect handler as
`ctx.trace`, to every worker dispatch as `task.trace`, and to every run an
effect launches, including workflow child runs. A launch can set its own
`trace`, for example to parent the child under a span the handler started.
Forks keep the source's context. Looms creates no spans itself. The object's
keys are the W3C header names, so with OpenTelemetry,
`propagation.extract(context.active(), ctx.trace ?? {})` gives the parent
context for a handler's span.

## Worker effect protocol

1. The runtime dispatches `{ runId, effectId, attempt, type, input, details?, trace?, deadlines? }`.
   `details` is the progress carried by the previous attempt's last heartbeat.
   `deadlines` holds the schedule-to-start time and the start-to-close and
   heartbeat timeouts from the effect's retry policy.
2. The worker calls `started` before the schedule-to-start deadline.
3. Long work calls `heartbeat`. Each accepted heartbeat extends the heartbeat
   deadline without exceeding start-to-close. A heartbeat may include `details`;
   the latest details are kept across retries and sent on the next dispatch.
4. The worker calls exactly one of `complete` or `fail`. `fail` may set
   `nonRetryable` to stop the retry policy, or `retryAfterMs` to wait at least
   that long before the next attempt (the policy backoff is never shortened).
   A local handler does the same by failing with `failEffect`.
5. On cancellation, stop side effects and call `cancelled`.

Each callback response is `{ status: 'accepted' | 'stale' | 'cancelled', cancelRequested }`.
The host no longer returns the run state. `cancelRequested` is how a worker learns
that an attempt already in progress should stop: a queued dispatch cannot be recalled.
`stale` means the report was for another attempt, or the attempt had already settled,
and the host recorded nothing.

Callbacks include the same `effectId` and `attempt`. Stale callbacks are ignored.
A worker with `dispatchSemantics: 'acknowledged'` promises that a rejected
`dispatch` sent nothing, so the attempt fails under the retry policy. Because its
transport can still lose a message it accepted, creating a runtime fails unless
every effect that worker claims sets `retry.scheduleToStartTimeoutMs`.

For **unacknowledged** workers, a rejected `dispatch` does not park as ambiguous.
The attempt enters `dispatch_wait` via `runtime.effect.dispatch.deferred`, then the
host retries the same attempt on later wakes with dedicated outbox backoff (not the
effect's retry policy). Workers must treat `(runId, effectId, attempt)` as
idempotent — a rejected push may still have arrived, so `started` from
`dispatch_wait` is accepted. After many deferred tries the host parks as
`ambiguous` for an operator. Prefer `dispatchSemantics: 'acknowledged'`
(Cloudflare Queues) when the transport can promise a reject sent nothing.

`ambiguous` remains for misconfiguration (no worker), cancellation acknowledgement
timeouts, and exhausted dispatch relays. Use `retryEffect` or
`POST /runs/:runId/effects/:effectId/retry` after verifying the destination
(including from `dispatch_wait`). Never blindly retry a non-idempotent effect.

Creating a runtime also fails when:

- an effect is declared with `placement: 'worker'` and no `EffectWorker` is configured
- a worker's `handles` list (or predicate) claims an effect declared with `placement: 'local'`

### Cloudflare Queues transport

`cloudflareQueueWorker` sends each attempt to a Cloudflare Queue as JSON. Every
routed effect needs `retry.scheduleToStartTimeoutMs`. An input that would push the
message past 100 KB is stored in `blobs` and sent as `inputRef`; without a blob
store that dispatch fails. Secrets never go on the queue.

```ts
import { defineEffect } from '@swirls/looms/core'
import { cloudflareQueueWorker } from '@swirls/looms/cloudflare'

const sandboxExec = defineEffect({
  type: 'sandbox.exec',
  placement: 'worker',
  retry: { maxAttempts: 3, scheduleToStartTimeoutMs: 60_000 },
})

const worker = cloudflareQueueWorker({
  routes: [{ effects: [sandboxExec], queue: env.SANDBOX_QUEUE }],
  blobs: r2BlobStore(env.BLOBS),
})

createLooms({ modules, worker, maxInFlightWorkerEffects: 16 })
```

`sandboxExec` has no handler because this file is the host. The consumer is a
separate program. It imports the same definition and binds the handler with
`workerHandlers`, so the handler's dependencies stay in the consumer program.
The definition holds the type, the input schema, and the retry policy.

A consumer runs handlers of the form `(task, ctx) => events`. `ctx` is a
`WorkerEffectContext` (`placement: 'worker'`): secrets are loaded before the
handler runs (`ctx.secrets`), `ctx.heartbeat(details)` reports progress,
`ctx.emit` buffers events until completion (not a live stream), and `ctx.signal`
aborts when the run is cancelled. Prefer `workerHandlers([[definition, handler]])`
with **worker-placed** definitions so input is validated with the effect's schema.
Throw a `QueueTaskError` with `nonRetryable` or `retryAfterMs` to control the retry.

```ts
import { createLoomsClient } from '@swirls/looms/client'
import {
  cloudflareQueuePullSource,
  createQueuePullConsumer,
  queueConsumer,
  workerHandlers,
} from '@swirls/looms/cloudflare'

const callbacks = createLoomsClient({ baseUrl, workerCallbackToken })
const handlers = workerHandlers([[sandboxExec, runSandbox]])

// In a Worker: export default { queue: queueConsumer({ callbacks, handlers, blobs }) }

const consumer = createQueuePullConsumer({
  source: cloudflareQueuePullSource({ accountId, queueId, token }),
  callbacks,
  handlers,
  blobs,
  concurrency: 8,
})

process.once('SIGTERM', () => consumer.stop())
```

- The consumer acks a message once Looms accepts `started`. After that Looms owns
  retries through heartbeat and start-to-close timeouts, so a long effect does not
  depend on the queue's lease. A duplicate or stale delivery is acked without running.
- A message that cannot start yet is retried by the queue with backoff. One that
  never starts lands in the dead-letter queue, and the schedule-to-start timeout
  schedules a new attempt.
- A queue send that fails, such as a 429, fails the attempt under the retry policy.
- The pull consumer batches acks, backs off while the queue is empty or the API
  errors, and reports `backlog()` from Cloudflare's `message_backlog_count`.
  `stop()` stops pulling, waits for running attempts, and sends the last acks.
- `maxInFlightWorkerEffects` caps how many worker attempts one run has in flight,
  so a wide fan-out cannot fill a shared queue.
- `createMemoryQueue()` has Cloudflare's lease, retry, and dead-letter behavior for tests.

## Inspection and repair

- `inspectRun(runId)` and `GET /runs/:runId/status` expose stream bounds, state,
  outstanding effects (with `placement`), deadlines, attempts, and last errors.
- `GET /runs/:runId/effects` is the focused effect view; each entry includes
  `placement` (`local` or `worker`).
- `GET /definitions/effects` lists every registered effect: type, `placement`, retry
  policy, and input schema when the effect declares one.
- `runtime.effectPlacements` is the in-process placement map (`local` or `worker`).
- `recoverDeadlines` and `POST /operations/deadlines/rescan` enumerate all runs
  and restore durable timer/effect scheduling after startup or repair.
- Projector delivery exposes `inspect`, `requeue`, and `recover`. Requeue is the
  explicit reset for dead-lettered work.

Every HTTP route except `GET /health` passes through the `authorize(request,
route)` hook given to `createLooms`, `createLocalActorHost`, or
`LoomsDurableObject`. `route` carries the access level (`read`, `write`,
`worker`, or `operations`), the route name, and the `runId` when there is one;
return `authAllowed` or `authDenied(status, error)`. Without a hook, read and
write routes are open while worker callbacks and operational endpoints answer 503. `bearerAuth` covers the common case:

```ts
createLooms({
  modules,
  authorize: bearerAuth({ worker: env.WORKER_TOKEN, operations: env.OPS_TOKEN }),
})
```

Each configured level requires `Authorization: Bearer <token>`; levels without a
token keep the default behavior. The client's `workerCallbackToken` option sends
the worker token on `workerCallback` requests.

An allowed decision can also say who the request acts as. Return
`authAllowedAs(actorId)` and every event the request sends is recorded with
`origin: { type: 'external', actorId }`, replacing any origin the request wrote
itself. `route.signal` names the signal a `POST /runs/:runId/signals/...`
request sends, as `namespace/name`, so a policy can allow some signals and not
others:

```ts
createLooms({
  modules,
  authorize: (request, route) =>
    Effect.gen(function* () {
      const user = yield* signedInUser(request)

      if (!user || (route.access === 'write' && route.signal !== 'chat/say')) {
        return authDenied(403, 'Forbidden')
      }

      return authAllowedAs(user.id)
    }),
})
```

On Cloudflare the Worker usually knows who is signed in, not the Durable
Object. Pass `authorize` to `routeToDurableObject` to decide in the Worker: a
denied request never reaches an object, and the actor an allowed decision names
travels to the object in a header that clients cannot set. Give the object
`forwardedActorAuth()` so it records that actor. The Worker's `route` has no
`attributes`, because the Worker does not read the run; `describeRoute(method,
pathname)` returns the same description for any other front.

```ts
// Worker
routeToDurableObject(env.RUNS, request, {
  authorize: async (request, route) => {
    const user = await signedInUser(request)
    return user ? authAllowedAs(user.id) : authDenied(401, 'Unauthorized')
  },
})

// Durable Object
configure() {
  return { modules, authorize: forwardedActorAuth() }
}
```

Use `forwardedActorAuth` only on a host that clients cannot reach directly.

Browsers cannot set headers on `EventSource` or `WebSocket`. `grantAuth` verifies
a short-lived HMAC grant from the `grant` query parameter, or from a `v1.` value
in `Sec-WebSocket-Protocol` when the query parameter is absent. The grant names
one run, one principal, and `read` access. It does not authorize writes, worker
callbacks, operations, the debugger, or a different run. `exp` is an exclusive
Unix millisecond timestamp. A host that accepts the grant as a WebSocket
subprotocol must echo that protocol on the upgrade response (`grantSubprotocol`
returns it); the Durable Object socket already does. The query parameter needs no
echo.

```ts
import { Effect } from 'effect'
import { grantAuth, issueRunGrant } from '@swirls/looms/runtime'

const secret = env.GRANT_SECRET
const grant = await Effect.runPromise(
  issueRunGrant(secret, {
    runId,
    principal: userId,
    access: 'read',
    exp: Date.now() + 5 * 60_000,
  }),
)

createLooms({
  modules,
  authorize: grantAuth({ secret }),
})

const events = new EventSource(`/runs/${runId}/events?live=true&grant=${grant}`)
```

## Retention and compaction

Snapshots accelerate runtime recovery but do not rebuild arbitrary projections.
`trimAfterSnapshot.coverage` must prove either:

- an archive contains every event through the trim cursor, or
- an explicit, authoritative `requiredProjectors` list is non-empty and every
  listed identity has a `projectorCursors` checkpoint at or beyond that cursor.

```ts
trimAfterSnapshot: {
  keepSnapshots: 2,
  coverage: async (runId) => ({
    requiredProjectors: ['search@v2', 'audit@v1'],
    projectorCursors: await loadProjectorCursors(runId),
  }),
}
```

Without proof, trimming fails with `UnsafeEventStoreTrimError` and the
authoritative log remains intact. Keep archived events for the longest required
replay/audit window and test restores before enabling retention.

A Postgres or SQLite replica can drop event copies for one tenant or project
with `replica.purge({ finishedBefore, where: { tenantId: 'acme' } })`. `where`
takes declared attributes only, and every key you pass must match the run's
column. Index the attributes you purge on.

After the replica has acknowledged a terminal run and every required projector
has caught up, delete the actor's Durable Object storage with
`deleteTerminalRunStorage` from `@looms/cloudflare`, or
`stub.deleteTerminalRunStorage({ requireProjectors: ['postgres-replica@1'] })` on
`LoomsDurableObject`. The run must be terminal; when `requireProjectors` is set,
the event store must have projectors attached and each identity's delivery
cursor must be at or beyond the log tail. A refusal throws `RunNotTerminalError`
or `ProjectorCoverageError` and deletes nothing.

## Versioned deploy and rollback

Definitions and projectors are versioned identities. Deploy additively:

1. Ship code that reads the old and new event schemas.
2. Register the new definition/projector version.
3. Route only new runs to it; let old runs retain their recorded version.
4. Wait for projector lag to reach zero, then remove old writers.

Rollback application routing without rewriting event history. Keep the binaries
and schemas needed by active old-version runs. If a new projector is bad, stop
delivery, deploy a corrected new version, and rebuild from archive; do not move a
checkpoint backward after source events were trimmed.

## Effect contracts and worker versioning

An effect `type` is a durable contract between the run that invokes it and the
worker that claims it. Changing what an input or outcome means under the same
type breaks in-flight attempts and recorded logs. Version the type instead:

- Prefer an explicit suffix such as `payments.charge@v2` (or a new leaf name)
  when the input schema, side effects, or completion events change.
- Keep the old type and its handler until every outstanding attempt of that type
  has settled. New runs can route to the new type immediately.
- Declare each version with `placement: 'worker'` and list those definitions on
  the queue route (`effects: [paymentsChargeV2]`). An `EffectWorker`'s `handles`
  list or predicate still decides which types a fleet claims at dispatch: run a
  v1 fleet that claims only `payments.charge` beside a v2 fleet that claims
  `payments.charge@v2`. Do not have two fleets claim the same type with
  incompatible behavior.
- Recorded run logs stay valid across binary upgrades because fold is a pure
  function of the log and the registered modules. The replay corpus under
  `packages/testing/corpus` is folded in CI with `assertCorpusEntry`; re-record
  a fixture only after confirming a fold or reducer change is intentional
  (`bun packages/testing/scripts/record-corpus.ts`).

This replaces Temporal `patched()` and worker build-id versioning for Looms
effects: the type string is the contract, and the log is the source of truth.

## Resolving definitions

Pass `definitionResolver` to `createLooms`, `createRuntime`, an actor host, or
`LoomsDurableObjectConfig` when a definition is not in the module's static list.
`resolve(kind, name, version)` returns the full definition object, or `undefined`
when that version does not exist. Registered module definitions are checked
first. Results, including misses, stay in an LRU cache.

Start, spawn, and launch resolve before they write `runtime.thread.started`.
A miss fails the start with `UnknownDefinitionError` and writes no events. The
accepted version is pinned on `runtime.run.started` and `runtime.thread.started`.
Before a wake replays a log, those pinned identities are resolved again so fold
can read them synchronously. An unknown workflow version fails that thread.
Evaluator definitions include `version`, which defaults to `v1`.

## Production configuration

Configure durable storage, actor routing, worker and operations tokens, bounded
retry policies, effect timeouts, snapshot cadence, an archive before compaction,
and startup deadline recovery. Attach a `RuntimeObserver` and
`ProjectorObserver`; `@looms/otel` is optional and keeps OpenTelemetry out of
core. Alert on append conflicts/errors, append and snapshot latency, timer
lateness, ambiguous effects, timeout/retry volume, cancellation ambiguity,
projector lag, and dead letters.
