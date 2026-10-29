# Northline

Northline is a regional LTL exception desk. A dispatcher opens a recovery for a shipment that is late, damaged, or short. The desk looks it up, classifies the exception, asks a service lead when the freight needs a person, books a linehaul recovery, and emails the consignee.

It is a Looms app: one workflow, one evaluator, one conversational agent, one approval gate, one schedule, and three custom modules. The host is a Cloudflare Worker.

## Run

From the repo root:

```sh
bun install
bun run northline
```

The desk is at <http://127.0.0.1:5174>. The worker is at <http://127.0.0.1:8791>.

`OPENROUTER_API_KEY` swaps the dispatcher onto OpenRouter. `TYPESAFE_AI_API_KEY` swaps the evaluator onto TypeSafe. Without those keys the desk uses the deterministic stand-ins, so the board behaves the same way every time.

## How a recovery runs

`recover-shipment` is the case.

| Step         | What it does                                                             | Where it runs                                   |
| ------------ | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Look up      | Read the shipment from the board the actor already holds                 | Local effect                                    |
| Classify     | Score the exception, or skip the model for damage and high-value freight | Evaluator, spawned in the run                   |
| Service lead | Park until someone books or holds                                        | Approval gate, skipped when the route is auto   |
| Linehaul     | Book Red Cedar                                                           | Worker effect on the `northline-recovery` queue |
| Notice       | Record the consignee email                                               | Local effect                                    |

A delivered shipment is refused in admission, before a queue message exists. The booking id is the effect id, so a retry hits the same partner key.

## Modules

Built in: `agent` (`dispatcher`), `workflow` (`recover-shipment`, `lane-digest`), `evaluator` (`classify-exception`), `approval`, `schedule` (`morning-sweep`).

Custom:

- `shipments` looks up a PRO and folds the morning digest. Both effects are local. A point read should not cross a queue.
- `recovery` books the partner. The effect is worker-placed. `confirmBooking` lives in `@looms/northline/recovery` and is imported by the queue consumer, not by the Durable Object host.
- `notices` records the email in the run. Sending mail from the actor keeps the consignee copy next to the decision that produced it.

The morning sweep is cron `0 13 * * 1-5` UTC on the fixed run `northline-morning-sweep`. The worker reconciles that run on the first API request and from the cron trigger. The sweep page can also count the lanes immediately.

## Two Durable Objects

`LoomsRun` is one object per run. A run object cannot list its siblings, so the board is a second object, `DeskBoard`. Opening a case inserts the row before the run starts, because the status projector can update that row before `start` returns. The projector writes `waiting` when an approval is requested, `running` when it is decided, and the terminal status when the run ends. A redelivered batch writes the same status. A digest or desk-chat run matches no row.

Reads and writes on a run stay open. Worker callbacks require `LOOMS_WORKER_TOKEN`. Local dev sets `northline-dev-worker` in `wrangler.jsonc`. A deploy should replace that with `wrangler secret put LOOMS_WORKER_TOKEN`.

## Postgres replica

Each run's log lives in that run's Durable Object. When a database is configured, `LoomsRun` also attaches `postgresReplica`, so every event is copied into Postgres the desk owns. Delivery runs after the append commits. The case page reports how far that copy has got.

Local dev uses `DATABASE_URL` in `apps/northline-worker/.dev.vars`. Production binds Hyperdrive as `NORTHLINE_DB` (prepared statements off, which Hyperdrive requires). Hyperdrive wins when both are set. Without either, the desk still runs and the case page says the copy is not attached.

The host uses `migrate: 'verify'`. Apply the SQL in `apps/northline-worker/migrations` before the first request:

```sh
looms replica migrate --database "$DATABASE_URL"
```

Generate again only when Looms ships a new replica migration. `bun test` in the worker fails if `migrations/` is behind `looms replica generate`.

The floor desk is one shared conversation on the board object. A recovery the dispatcher opens stays on that conversation. A case on the board is the tracked recovery.
