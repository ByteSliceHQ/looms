`# Looms

**Deploy durable agents and workflows. Subscribe from any client via an event log.**

Looms is an Effect-based actor runtime: every agent turn and workflow node appends to an ordered event stream. Reduce the log to recover state, park on HITL or child actors, and resume after crashes. Clients materialize the same events with `@looms/livestore` / `@looms/livestore/react` — no bespoke WebSocket protocol required, and no direct `@livestore/*` installs.

Built to be a standalone OSS package and a future internal engine for [Swirls](https://swirls.ai).

## Why Looms

| | Looms | Temporal-style workflows |
|---|---|---|
| Unit of durability | Event log per actor (S2 or memory) | Workflow history / activities |
| Agents | First-class (turns, tools, sub-agents) | Usually activities calling an LLM |
| HITL | `review.requested` / `review.decided` in the log | Signals / updates |
| Client sync | `@looms/livestore/react` + `/api/livestore` proxy | Custom polling / queries |
| Local default | In-memory EventStore | Needs a server |

## Stack

- **Effect** — wake loops, store I/O, typed services
- **S2** (`s2.dev` / s2-lite) — optional durable stream log via `@looms/s2`
- **LiveStore** — client materialization via `@looms/livestore` / `@looms/livestore/react` (wraps LiveStore **0.5 / Effect 4**)
- **Bun + Turborepo + Oxc** — workspace tooling, task graph, and lint
- **Projectors** — optional secondary indexes via `@looms/projectors` (memory, Postgres, SQLite, or custom)

## Quickstart

```bash
bun install
bun run verify          # turbo: typecheck + test + demo verify + lint (+ package build for publish)

# Demo UI (LiveStore + auto-started s2-lite)
bun run demo            # starts @looms/demo on :8787 (auto-starts s2-lite in dev)
# open http://127.0.0.1:8787
```

Call the demo HTTP API (same origin as the UI):

```bash
curl -s -X POST http://127.0.0.1:8787/actors/agent \
  -H 'content-type: application/json' \
  -d '{"definitionName":"echo","input":{"text":"hi"}}'

curl -s -X POST http://127.0.0.1:8787/actors/workflow \
  -H 'content-type: application/json' \
  -d '{"definitionName":"hitl","input":{"doc":"draft"}}'
```

Host setup with `createLooms`:

```ts
import { createLooms } from '@looms/runtime'
import { s2, s2ConfigFromEnv, s2Lite } from '@looms/s2'
import { definitions } from './definitions'

export const looms = createLooms({
  definitions,
  store: process.env.LOOMS_S2_ENDPOINT
    ? s2(s2ConfigFromEnv(process.env))
    : s2Lite({ env: process.env }),
})
```

React client (full LiveStore — no `@livestore/*` deps):

```ts
import {
  LoomsLiveStoreProvider,
  useActorStore,
  queries,
  decideReview,
} from '@looms/livestore/react'

const store = useActorStore(actorId)
const messages = store.useQuery(queries.messages)
decideReview(store, { reviewId, outcome: 'approve' })
```

Light client subscribe (without React / SQLite):

```ts
import { createLoomsStore } from '@looms/livestore'

const store = createLoomsStore({
  storeId: actorId,
  endpoint: 'http://127.0.0.1:8787',
})
store.subscribe(() => {
  console.log(store.query.messages())
  console.log(store.query.reviews())
})
await store.commit({
  type: 'review.decided',
  payload: { reviewId, actionId: 'approve', outcome: 'approve' },
})
```

HTTP client (same-origin in the browser, or pass `baseUrl` for CLI / remote hosts):

```ts
import { createLoomsClient } from '@looms/client'

const client = createLoomsClient() // → /actors/...
const { actorId } = await client.startAgent('echo', { text: 'hi' })
await client.decideReview(actorId, reviewId, { actionId: 'approve', outcome: 'approve' })
```

CLI (against a running host):

```bash
export LOOMS_URL=http://127.0.0.1:8787
bun run --filter @looms/cli looms -- call agent echo '{"text":"hi"}'
bun run --filter @looms/cli looms -- events <actorId>
bun run --filter @looms/cli looms -- review <actorId> <reviewId> --approve
```

Legacy observer (superseded by the demo UI):

```bash
LOOMS_URL=http://127.0.0.1:8787 bun run --filter @looms/observer start
# open http://127.0.0.1:8788
```

## Architecture

Actors are either **agents** (LLM/tool turns) or **workflows** (DAG nodes). The host appends events, reduces state, and executes owed work until the actor is terminal or parked (`waiting_review`, `waiting_child`, `waiting_timer`).

```
Client (LiveStore / CLI / Demo UI)
        │  pull / push / RPC
        ▼
Effect host (wake → reduce → transitions → append)
        │
        ▼
EventStore (memory or S2 stream per actor)
```

See [docs/architecture.md](./docs/architecture.md), [docs/livestore.md](./docs/livestore.md), [docs/ai-providers.md](./docs/ai-providers.md), [docs/snapshots.md](./docs/snapshots.md), [docs/swirls-adapter.md](./docs/swirls-adapter.md), and [docs/releasing.md](./docs/releasing.md).

## Packages

| Package | Description |
|---|---|
| `@looms/core` | Events, reducers, definitions, memory EventStore |
| `@looms/agent` | Agent turn + tool execution |
| `@looms/workflow` | Workflow schedule + node execution |
| `@looms/s2` | S2 EventStore adapter |
| `@looms/runtime` | Wake loop, HTTP host, LiveStore proxy |
| `@looms/ai-vercel` | Vercel AI SDK `LlmAdapter` (`generateText` / `streamText`, no tool execute) |
| `@looms/client` | HTTP client factory (`createLoomsClient`) for host routes |
| `@looms/livestore` | Materializers, light store, bridge; `@looms/livestore/react` for full LiveStore |
| `@looms/cli` | `looms` CLI |
| `@looms/projectors` | Pluggable secondary-index projectors (memory, Postgres, SQLite) |
| `@looms/demo` | Sample host + TanStack Start UI (LiveStore + s2-lite) |
| `@looms/observer` | Legacy minimal event / review UI |

## License

Apache-2.0
