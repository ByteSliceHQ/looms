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
