# Looms

**Durable agents, workflows, and human approvals — composed like packages.**

Looms is an SDK for long-running work in your application. Each **run** is an event log you can crash-recover, replay, and subscribe to from a UI. Plug in agents, DAG workflows, approvals, and your own domain modules (payments, tickets, search). They compose: a workflow can wait on an approval, then charge a card; an agent can spawn that workflow as a tool.

## Why Looms

- **Durable by default.** Progress is the log. Restart the host and the run continues.
- **Composable.** Mix first-party modules with your own. Ship only what the app needs.
- **One stream, many views.** The same events power a chat transcript, a debugger, a ledger, and pending-approval badges.
- **Human in the loop.** A run parks until someone decides; the UI posts an approval and work resumes.
- **Actor cells in production.** One writer per `runId` (Cloudflare Durable Objects recommended; Bun SQLite actors locally). Optional S2 as a projector lake for cross-run analytics.

## Quickstart

```bash
bun install
bun run examples        # small createLooms scripts under examples/
bun run dev             # demo http://127.0.0.1:8787 + docs http://127.0.0.1:8788
# or either alone: bun run demo | bun run docs
# Cloudflare worker demo: bun run dev:cloudflare (worker also defaults to :8788 — stop docs first)
```

Minimal hosts live in [`examples/`](./examples) (echo agent, workflow, approval, custom module). The demo app is the fuller UI.

Host it in your app:

```bash
bun add @swirls/looms
```

```ts
import { agent, defineAgent } from '@swirls/looms/agent'
import { createLooms } from '@swirls/looms'
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
  modules: [agent({ definitions: [echo] })],
  // store: s2(s2ConfigFromEnv(process.env)),
})

const { runId } = await looms.start(echo, { text: 'hi' })
```

`start` takes any definition — an agent, a workflow, or a kind from your own module — and types the input from its schema. Pass the modules you need (`agent()`, `workflow()`, `approval()`, or your own) into `createLooms` (see the Modules guide in the docs site).

React client:

```ts
import { LoomsProvider, useRunStore, useProjection } from '@swirls/looms/react'
import { conversation, userMessage } from '@swirls/looms/agent'
import { decision } from '@swirls/looms/approval'

const store = useRunStore(runId)
const convo = useProjection(store, conversation)
await store.commit(userMessage('Also greet Maya'))
await store.commit(decision(approvalId, 'approve'))
```

HTTP client:

```ts
import { createLoomsClient } from '@swirls/looms/client'
import { decision } from '@swirls/looms/approval'

const client = createLoomsClient()
const { runId } = await client.start(echo, { text: 'hi' })
await client.signal(runId, [decision(approvalId, 'approve')])
```

Runs speak one language: `start` a definition, `signal` events into it, read `projections` out. Modules ship helpers that build their events (`userMessage`, `decision`), so nothing agent- or approval-specific lives in the core client.

## Docs

Canonical docs: `bun run docs` → http://127.0.0.1:8788 (`apps/docs`)

| Section                            | What it covers                                                |
| ---------------------------------- | ------------------------------------------------------------- |
| Introduction                       | Map of the docs                                               |
| Concepts                           | Overview, runs & threads, events & effects, durable execution |
| Quickstart / Examples              | Run the demo, then copy patterns                              |
| Modules / Projections / Durability | Author, project, and host                                     |
| API / SDK · Math                   | Reference and formalism                                       |

Repo markdown under [`docs/`](./docs) is supplementary (protocol tables, snapshots notes, AI providers). Prefer the site for the mental model and builder path.

## Package modules

Looms publishes as one package. Explicit subpaths keep browser, server, provider, and storage
boundaries clear. Migrate an old import by changing `@looms/<module>` to
`@swirls/looms/<module>`; install only `@swirls/looms`.

| Module                     | Import when you need                        |
| -------------------------- | ------------------------------------------- |
| `@swirls/looms/runtime`    | `createLooms`, HTTP host                    |
| `@swirls/looms/actor`      | `createLocalActorHost`, per-run actor cells |
| `@swirls/looms/cloudflare` | Durable Object / celld actor host           |
| `@swirls/looms/agent`      | `defineAgent`, tools, `conversation`        |
| `@swirls/looms/workflow`   | `defineWorkflow`                            |
| `@swirls/looms/approval`   | `gate`, `pendingApprovals`                  |
| `@swirls/looms/core`       | Custom modules: `defineModule`, `invoke`    |
| `@swirls/looms/client`     | HTTP client                                 |
| `@swirls/looms/react`      | `useRunStore` / `useProjection`             |
| `@swirls/looms/s2`         | Durable event log                           |
| `@swirls/looms/ai-vercel`  | Vercel AI SDK models                        |
| `@swirls/looms/projectors` | Cross-run indexes                           |
| `@swirls/looms/testing`    | `createTestRuntime`, replay checks          |
| `@swirls/looms/cli`        | Inspect and approve runs from a terminal    |

## License

Apache-2.0
