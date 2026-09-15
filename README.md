# Looms

**Durable agents, workflows, and human approvals — composed like packages.**

Looms is an SDK for long-running work in your application. Each **run** is an event log you can crash-recover, replay, and subscribe to from a UI. Plug in agents, DAG workflows, approvals, and your own domain modules (payments, tickets, search). They compose: a workflow can wait on an approval, then charge a card; an agent can spawn that workflow as a tool.

## Why Looms

- **Durable by default.** Progress is the log. Restart the host and the run continues.
- **Composable.** Mix first-party modules with your own. Ship only what the app needs.
- **One stream, many views.** The same events power a chat transcript, a debugger, a ledger, and pending-approval badges.
- **Human in the loop.** A run parks until someone decides; the UI posts an approval and work resumes.
- **Local first.** In-memory store by default. Add S2 when you want a durable log.

## Quickstart

```bash
bun install
bun run dev             # demo http://127.0.0.1:8787 + docs http://127.0.0.1:8788
# or either alone: bun run demo | bun run docs
# Cloudflare worker demo: bun run dev:cloudflare (worker also defaults to :8788 — stop docs first)
```

Host it in your app:

```ts
import { createLooms } from '@looms/runtime'
import { defineAgent } from '@looms/agent'
import { z } from 'zod'

const echo = defineAgent({
  name: 'echo',
  instructions: 'Echo the user.',
  input: z.object({ text: z.string() }),
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: input.text },
    done: true,
    output: { text: input.text },
  }),
})

const looms = createLooms({
  definitions: [echo],
  // store: s2(s2ConfigFromEnv(process.env)),
  // modules: [agent({ llm: vercelLlm({ model }) }), workflow(), approval()],
})

const { runId } = await looms.start(echo, { text: 'hi' })
```

`start` takes any definition — an agent, a workflow, or a kind from your own module — and types the input from its schema. `createLooms` includes agent, workflow, and approval; pass `modules` to configure them or add a domain module (see [docs/modules.md](./docs/modules.md)).

React client:

```ts
import { LoomsProvider, useRunStore, useProjection } from '@looms/react'
import { conversation, userMessage } from '@looms/agent'
import { decision } from '@looms/approval'

const store = useRunStore(runId)
const convo = useProjection(store, conversation)
await store.commit(userMessage('Also greet Maya'))
await store.commit(decision(approvalId, 'approve'))
```

HTTP client:

```ts
import { createLoomsClient } from '@looms/client'
import { decision } from '@looms/approval'

const client = createLoomsClient()
const { runId } = await client.start(echo, { text: 'hi' })
await client.signal(runId, [decision(approvalId, 'approve')])
```

Runs speak one language: `start` a definition, `signal` events into it, read `projections` out. Modules ship helpers that build their events (`userMessage`, `decision`), so nothing agent- or approval-specific lives in the core client.

## Docs

- [Concepts](./docs/architecture.md) — runs, events, waits, projections
- [Modules](./docs/modules.md) — agents, workflows, approvals, your own domain
- [Protocol](./docs/protocol.md) — event types and HTTP
- [Snapshots & actors](./docs/snapshots.md) — per-run cells, Bun / Cloudflare / celld backends, S2 as projector
- [React](./docs/react.md) — React subscriptions
- [AI providers](./docs/ai-providers.md)

Site (`apps/docs`, `bun run docs` → http://127.0.0.1:8788): concepts, modules, projectors, API, examples.

## Packages

| Package             | Import when you need                                  |
| ------------------- | ----------------------------------------------------- |
| `@looms/runtime`    | `createLooms`, HTTP host                              |
| `@looms/actor`      | `createLocalActorHost`, per-run actor cells           |
| `@looms/cloudflare` | Durable Object / celld actor host                     |
| `@looms/agent`      | `defineAgent`, tools, `conversation`                  |
| `@looms/workflow`   | `defineWorkflow`                                      |
| `@looms/approval`   | `gate`, `pendingApprovals`                            |
| `@looms/core`       | Custom modules: `defineRuntimeModule`, `defineEffect` |
| `@looms/client`     | HTTP client                                           |
| `@looms/react`      | `useRunStore` / `useProjection`                       |
| `@looms/s2`         | Durable event log                                     |
| `@looms/ai-vercel`  | Vercel AI SDK models                                  |
| `@looms/projectors` | Cross-run indexes                                     |
| `@looms/testing`    | `createTestRuntime`, replay checks                    |
| `@looms/cli`        | Inspect and approve runs from a terminal              |

## License

Apache-2.0
