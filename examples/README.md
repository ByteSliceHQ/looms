# Examples

Small, self-contained scripts that show how to stand up a Looms runtime. The full demo app under `apps/demo` is richer; start here if you want the minimal shape of each pattern.

| Script                                   | What it shows                                                         |
| ---------------------------------------- | --------------------------------------------------------------------- |
| [`echo-agent.ts`](./echo-agent.ts)       | `defineAgent` + `createLooms({ modules: [agent()] })`                 |
| [`workflow.ts`](./workflow.ts)           | DAG workflow with node deps and a child spawn                         |
| [`approval.ts`](./approval.ts)           | Human `gate()`, then `signal` a `decision`                            |
| [`jev.ts`](./jev.ts)                     | `defineJev` scores a refund; a workflow branches, then maybe an agent |
| [`jev-live.ts`](./jev-live.ts)           | Same questions against hosted TypeSafe Jev (`AI_GATEWAY_API_KEY`)     |
| [`custom-module.ts`](./custom-module.ts) | Domain events/effects/projections composed with a workflow            |
| [`custom-thread.ts`](./custom-thread.ts) | Custom thread kind via `createKind` + `m.thread`                      |

## Run

From the repo root (after `bun install`):

```bash
bun run --filter @looms/examples echo-agent
bun run --filter @looms/examples workflow
bun run --filter @looms/examples approval
bun run --filter @looms/examples jev
bun run --filter @looms/examples jev-live   # requires AI_GATEWAY_API_KEY
bun run --filter @looms/examples custom-module
bun run --filter @looms/examples custom-thread

# or all of them:
bun run --filter @looms/examples all
```

Each script uses an in-memory store, prints a short summary, and exits.
