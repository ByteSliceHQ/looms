# Snapshots, actors, and S2 as a projector

The event log is the source of truth for a run. Concurrency is structural:
exactly one actor cell owns a `runId` at a time (Cloudflare Durable Object,
`celld`, or a sticky hash-routed process). There is no distributed lease,
heartbeat, or fencing token in the wake loop.

## Actor single-writer

`wake` uses an in-process mutex (`waking.has(runId)`). Ingress hashes `runId`
onto one instance so two processes never drive the same run. The primary
`EventStore` is local — `sqliteEventStore()` (embedded SQLite, also compatible
with Durable Object `ctx.storage.sql`) or `makeMemoryEventStore`.

Appends are sub-millisecond. The React client SSE reads the local store. If a node
dies, routing moves the run; the new actor loads `snapshot + delta` and
continues.

## Cold start = snapshot + delta

`wake`, `getRun`, `signal`, and `startRun` all begin with `loadCursor`:

1. `SnapshotStore.loadLatest(runId)` → materialized `RunState` at `cursor`.
2. `EventStore.read(runId, { fromSeq: cursor + 1 })` → fold the delta.

Inside a wake the cursor is a local variable that advances by local echo after
each append, so a streamed agent turn costs no extra reads.

### Snapshot on park

Every wake ends by writing a snapshot at the log tail (`persistSnapshot`), so
the next wake folds only what landed since. `snapshotEvery` (default 200
durable events, `0` disables) additionally snapshots mid-wake to bound replay
after a crash inside one long wake.

After each save the store is pruned to `trimAfterSnapshot.keepSnapshots`
(default 1). With `trimAfterSnapshot` set, the event log is also trimmed
behind the oldest kept snapshot.

Snapshot failures are swallowed; the log stays authoritative.

### Providers

- `makeMemorySnapshotStore` — default when nothing is attached.
- `bunSqliteEventStore()` (`@swirls/looms/core/bun-sqlite`) — Bun native SQLite engine.
- `sqliteEventStore({ exec })` (`@swirls/looms/core/sqlite-store`) — engine-agnostic embedded SQLite, used directly by Cloudflare Durable Object storage (`sqlStorageExec(ctx.storage.sql)`).
- `s2SnapshotStore` — optional lake-side snapshots (`snapshots/{runId}`).

## S2 is a projector

S2 is no longer the execution store. `s2Projector(config)` implements
`Projector` and fans committed events out to `runs/{runId}` for the global
stream lake, ETL, and replay.

```ts
import { bunSqliteEventStore } from '@swirls/looms/core/bun-sqlite'
import { withProjectors } from '@swirls/looms/projectors'
import { s2Projector } from '@swirls/looms/s2/projector'

const store = withProjectors(bunSqliteEventStore(), [s2Projector(config)])
```

Projection failures are isolated: the local log stays authoritative and the
wake continues. `s2()` remains available as a read/write adapter for the lake
itself.

## Actor hosts

Looms supports pluggable runtime hosts for actor single-writer execution:

1. **Bun process (`@swirls/looms/actor` + `@swirls/looms/core/bun-sqlite`)**: Local `createLocalActorHost` with one SQLite file and one actor cell per `runId`, plus in-process timer scheduling (`createTimeoutScheduler`).
2. **Cloudflare Durable Objects (`@swirls/looms/cloudflare`)**: Named actor cells on Cloudflare. Each cell owns a private SQLite database via `ctx.storage.sql` and schedules durable timer wakes via `ctx.storage.setAlarm()`.
3. **celld (`denoland/celld`)**: Self-hosted virtual actor daemon running the same Workers / Durable Objects bundle with S3-compatible bucket replication (`celld dev .` or `celld deploy . --bucket $CELLD_BUCKET`).

### Swapping backends in the demo

Set `LOOMS_BACKEND` in your environment:

- `LOOMS_BACKEND=bun` (default): Runs `createLocalActorHost` inside the TanStack app server (per-run SQLite under `.looms/runs/`).
- `LOOMS_BACKEND=cloudflare`: Proxies `/runs*` and `/api/events*` requests to `LOOMS_WORKER_URL` (default `http://127.0.0.1:8788`), where the Durable Object worker (`apps/demo-worker`) executes each run in its own cell.

Both backends share `resolveDemoLlm` / `resolveDemoProjectors` and the same default model (`LOOMS_MODEL`, default `openai/gpt-4o-mini`) when `OPENROUTER_API_KEY` is set. Without a key they use the stub `demoLlm` (scripted tool calls; assistant replies may include raw JSON tool payloads). Cloudflare mode loads secrets from `apps/demo/.env` via `wrangler dev --env-file ../demo/.env` (or `apps/demo-worker/.dev.vars`).

> **Note on `GET /runs`:** Actor cells are isolated databases keyed by `runId` (Bun host, Durable Objects, and celld). Global run enumeration (`GET /runs`) returns `501 Not Implemented`; recent-run lists should come from an async projector lake (such as S2) or client-side storage (as the demo UI does).

## Run cache

`runCacheSize` defaults to `0`. If enabled, a cached cursor is validated with
`store.tail` before use and dropped when the tail moves backwards (stream
recreated). The cache is an optimization only; correctness never depends on it.
