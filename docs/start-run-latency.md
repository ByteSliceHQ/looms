# Start-run latency on Cloudflare Durable Objects

Handoff note from staging Swirls (`feat/looms-engine`, 2026-11-10). Captures
why `POST /runs` (and therefore host `executeWorkflow`) was consistently
~4–5s even for a trivial graph, what was ruled out, and how it was fixed.

## Symptom

Swirls Cloud UI / API `workflows.executeWorkflow` returned in about 4–5
seconds for `reverse_text`. Operators expected sub-second enqueue.

## Measurement (staging API pod → engine)

Probes from `swirls-api` against `https://engine.staging.swirls-nonprod.dev`:

| Step                                        | Typical                     |
| ------------------------------------------- | --------------------------- |
| Autumn ensure + `execution_credits` check   | ~150ms                      |
| Platform DB lookups                         | ~10–50ms                    |
| Engine `GET /health`                        | ~330ms                      |
| Engine `POST /runs` (new `runId`)           | **3.3–5.0s** (TTFB ≈ total) |
| `GET /runs/:id` on that same DO after start | **45–80ms**                 |

Repeated `POST /runs` with distinct run ids stayed in the 3–5s band. Warm
reads on an already-created object did not. Billing and Postgres on the API
side are not the hotspot.

## Root cause

Each Looms run uses a **named Durable Object** (`idFromName(runId)`). A new
execution always hits a **cold** object.

Cell creation used to await projector recovery **before** the fetch/start
handler ran:

```ts
// packages/cloudflare/src/durable-object.ts (createCell) — before the fix
const recoverProjectors = delivery
  ? Effect.runPromise(delivery.recover(runId).pipe(Effect.andThen(delivery.deliver(runId))))
  : Promise.resolve()

return recoverProjectors.then(() => cell.recoverWake()).then(() => cell)
```

`deliver` initialized projectors (`projector.init`) on first use. Swirls
engine wires Hyperdrive-backed `postgresEventLog` and `postgres` projectors
that opened a connection and ran `ALTER TABLE ... IF NOT EXISTS` plus an
advisory-locked migration transaction. That work sat on the critical path of
the first request to a new DO, so `startRun` could not return until it
finished. Concurrent cold starts also contended on those table locks.

This is distinct from post-append projection. After the log commits,
`durableObjectEventStore` schedules delivery with `ctx.waitUntil`, so
ongoing projector apply is not supposed to block append. The cold-cell
`recover` + `deliver` gate was what blocked `POST /runs`.

## Fix (Looms)

1. **Defer** cold-cell `recover` + `deliver` (and alarm delivery) with
   `ctx.waitUntil`, matching post-append delivery.
2. **Skip** `projector.init` when the source log is empty or the cursor is
   already caught up (and the projector has no `position`).
3. **`migrate: 'auto' | 'verify' | 'skip'`** on `postgresEventLog` /
   `postgres`. `auto` uses versioned migrations and is lock-free when
   nothing is pending. Hosts that own DDL (Swirls drizzle `0084`/`0085`)
   should pass `verify` or `skip`.

## Related consumer follow-ups (Swirls)

- Prime compiled-graph pins inside the Durable Object `fetch`, not only the
  Worker isolate (definition resolve used to fall through to Hyperdrive).
- Share one lightweight Hyperdrive client per DO for projectors.
- Lower effects pull `maxIdleMs` so node-execute pickup is not up to 5s on a
  quiet queue.
- Keep the enqueue lifecycle lock across `startGraphWorkflow`; it becomes
  cheap once engine start is fast.

## Reproduction sketch

From a host with `ENGINE_URL` + service token:

1. `POST /runs` with a fresh ULID/UUID `runId`, pinned compiled graph in
   attributes, deployment-scoped `definitionName`.
2. Record TTFB.
3. Immediately `GET /runs/{runId}` twice — after the fix, cold POST should be
   within a few hundred ms of warm GET.

## Code pointers

| Area                           | Path                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Cold cell waitUntil            | `packages/cloudflare/src/durable-object.ts` (`createCell`, `alarm`)           |
| waitUntil append delivery      | `packages/cloudflare/src/event-store.ts` (`durableObjectEventStore`)          |
| Skip init on empty / caught-up | `packages/projectors/src/delivery.ts` (`deliverProjector`)                    |
| Migration modes                | `packages/projectors/src/event-log.ts`, `packages/projectors/src/postgres.ts` |
| Production guarantees          | `docs/production.md`                                                          |
| Swirls engine projector wiring | `swirls-platform/apps/engine/src/index.ts`                                    |
| Swirls enqueue holds txn       | `swirls-platform/packages/workflow-runs/src/index.ts` (`enqueueWorkflowRun`)  |
