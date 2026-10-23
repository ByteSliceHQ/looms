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

`attributes` on `start` are immutable labels (tenant, project, org). They are
written on `runtime.run.started`, folded into run state, and copied onto the
run summary. Authorization receives them on `route.attributes` when a run has
any. They must be safe for every reader of the run.

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

1. The runtime dispatches `{ runId, effectId, attempt, type, input, details? }`.
   `details` is the progress carried by the previous attempt's last heartbeat.
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
A dispatch transport failure is recorded as `ambiguous`: an operator must first
verify the destination's idempotency record, then use `retryEffect` or
`POST /runs/:runId/effects/:effectId/retry`. Never blindly retry a non-idempotent
effect.

### Cloudflare Queues transport

`cloudflareQueueWorker` connects Durable Objects to external workers or background fleets over Cloudflare Queues:

```ts
import { cloudflareQueueWorker } from '@swirls/looms/cloudflare'

const worker = cloudflareQueueWorker({
  routes: [{ handles: ['sandbox.exec', 'batch.convert'], queue: env.WORKER_QUEUE }],
})
```

- **Acknowledged dispatch**: `dispatchSemantics: 'acknowledged'` treats a thrown send (including 429 rate limits) as an un-enqueued failure retried with backoff, eliminating ambiguous dispatch operator interventions.
- **One retry authority**: Consumers acknowledge the queue message immediately once the `started` callback succeeds. From that point on, Looms heartbeats and start-to-close deadlines govern execution liveness.
- **Fairness guard**: `maxInFlightWorkerEffects` caps concurrent in-flight dispatches per run, preventing a single fanout from saturating a shared queue.
- **In-flight cancellation**: Because enqueued messages cannot be recalled from Cloudflare Queues, in-flight attempts learn of cancellation from heartbeat responses and abort the task signal.

## Inspection and repair

- `inspectRun(runId)` and `GET /runs/:runId/status` expose stream bounds, state,
  outstanding effects, deadlines, attempts, and last errors.
- `GET /runs/:runId/effects` is the focused worker view.
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
