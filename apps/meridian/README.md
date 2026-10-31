# Meridian

Meridian is an algorithmic trading desk. A simulated exchange ticks in the browser. Looms runs the decisions: a strategy session, the risk gate, the order, and the grade of the fill. An analyst can quote the book, open a session, or halt one. Two weekday schedules open the default book and attribute the day's fills.

The market is deterministic. The same symbol and tick always print the same ladder, so a replay of a session does not need a recording of the tape. Live Robinhood Crypto orders are optional and off until you arm them yourself.

## Run

From the repo root:

```sh
bun install
bun run meridian
```

The desk is at <http://127.0.0.1:5174>. The worker is at <http://127.0.0.1:8791>. `bun run meridian` applies the D1 replica migrations locally before Wrangler starts.

`OPENROUTER_API_KEY` swaps the analyst onto OpenRouter. `TYPESAFE_AI_API_KEY` swaps fill grades onto TypeSafe. Without those keys the desk uses the deterministic stand-ins.

## How a session runs

`trade-session` loops `trade-cycle` on one symbol.

| Step    | What it does                                           | Where it runs                                |
| ------- | ------------------------------------------------------ | -------------------------------------------- |
| Observe | Record the quote for this tick                         | Local effect                                 |
| Signal  | Momentum or mean-revert from the prints                | Local effect                                 |
| Risk    | Position, drawdown, and the live notional caps         | Local effect. Reads the kill switch          |
| Review  | Ask a person on a soft breach, and on every live order | Approval gate                                |
| Execute | Match the simulated book, or send a live order         | Worker effect on the `meridian-orders` queue |
| Grade   | Score the fill against the arrival price               | Evaluator                                    |

A blocked order is skipped. A rejection skips the order and the session continues. Halt cancels the run. Resume forks it, so the next wake continues from the cut.

The order's client id is a UUID derived from the effect id. A retry hits the same key. The host imports the effect definition. The queue consumer imports `@looms/meridian/execution`, which is the only module that talks to a broker.

## Modules

Built in: `agent` (`analyst`), `workflow` (`trade-session`, `trade-cycle`, `open-book`, `eod-recon`), `evaluator` (`grade-fill`), `approval`, `schedule` (`market-open`, `end-of-day`).

Custom:

- `market` records a quote. Simulated quotes are a pure function of symbol and tick. A live quote is fetched only when that session's venue is Robinhood, and the print is stored on the run so replay does not call the API again.
- `signals` turns the print history into a side and a size.
- `risk` passes, asks, or blocks. Every live order is a soft breach.
- `execution` submits the order. The effect is worker-placed.
- `ledger` folds fills into a book and loads the day's fills from D1 for the close.

`market-open` is cron `30 13 * * 1-5` UTC. `end-of-day` is cron `5 20 * * 1-5` UTC. The worker reconciles both on the first API request and from the cron trigger. The close fans out one attribution row per symbol from the fills copied into D1.

## Two Durable Objects

`LoomsRun` is one object per run. A run object cannot list its siblings, so the board is a second object, `DeskBoard`. Opening a session inserts the row before the run starts, because the status projector can update that row before `start` returns. The projector writes orders, approvals, and P&L without putting `opened_at` back.

Reads and writes on a run stay open. Worker callbacks require `LOOMS_WORKER_TOKEN`. Local dev uses `meridian-dev-worker` from `wrangler.jsonc` until you deploy.

The kill switch lives in D1 as well as on the board. A session reads D1, so a risk check does not have to call back into the board request that started it.

## D1 replica

Each run's log lives in that run's Durable Object. `LoomsRun` also attaches `sqliteReplica`, so every event is copied into a shared D1 database. Delivery runs after the append commits. The session page reports how far that copy has got. Without the binding, the desk still runs and the session page says the copy is not attached.

The host uses `migrate: 'verify'`. `bun run dev` applies `migrations/` to Wrangler's local D1 before the worker starts. Generate SQL again only when Looms ships a new SQLite replica migration. `bun test` in the worker fails if `migrations/` is behind `looms replica generate --dialect sqlite`.

## Robinhood

The simulated exchange is the default. A live order is possible only when `MERIDIAN_LIVE=1` and both `ROBINHOOD_API_KEY` and `ROBINHOOD_PRIVATE_KEY` are set, the symbol is `BTC-USD`, `ETH-USD`, or `SOL-USD`, and the cycle interval is at least five seconds. Every live order waits for a person. The default caps are $25 per order and $100 per day. `bun run up` does not set any of those and does not place an order.

## Deploy and tear down

From `apps/meridian-worker`, with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set:

```sh
bun run up
bun run down
```

Terraform creates the D1 database and the orders queue. `MERIDIAN_PREFIX` names a second pair (`prefix-replica`, `prefix-orders`) without editing the module. Wrangler deploys the worker: Durable Objects, both crons, the queue consumer, the D1 binding, and the desk UI as static assets on the same origin. `up` applies `migrations/`, sets `LOOMS_WORKER_TOKEN`, and prints the workers.dev URL. It does not set OpenRouter, TypeSafe, Robinhood, or `MERIDIAN_LIVE`. It prints the `wrangler secret put` lines for those.

`down` unbinds the queue, deletes the worker, and destroys the Terraform resources. Durable Object storage goes with the worker. The committed `wrangler.jsonc` keeps a placeholder D1 id for local dev. `up` writes the real id into `wrangler.deploy.jsonc`, which is not committed. Terraform state stays in `infra/` on the machine that ran `up`.
