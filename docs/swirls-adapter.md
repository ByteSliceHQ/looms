# Swirls adapter spike

Looms is designed so `swirls-platform` can host threads on the Looms kernel instead of Temporal, without importing Swirls product packages into this repo.

The compile-to-modules framing: Swirls keeps its DSL and product types. An adapter compiles a deployment snapshot into Looms `RuntimeModule`s carrying `defineAgent` / `defineWorkflow` definitions, then calls `createRuntime({ modules })`.

## Mapping

| Swirls concept                  | Looms concept                                                    |
| ------------------------------- | ---------------------------------------------------------------- |
| `execution_actors` row          | Run `runId` / S2 stream `runs/{id}`                              |
| `execution_events`              | `EventEnvelope` log (`@looms/core`)                              |
| `workflow_execution`            | module `@looms/workflow`, kind `workflow`                        |
| `agent_session`                 | module `@looms/agent`, kind `agent`                              |
| Temporal `swirlsGraphWorkflow`  | `@looms/workflow` reducer + host wake                            |
| Temporal signals (`review:*`)   | `@looms/approval` `approval.decided` + `runtime.signal.received` |
| Durable Object live projection  | `@looms/react` `useRunStore` / `useProjection`                   |
| Fabric macaroon / Anvil secrets | **Out of Looms** — inject via Swirls Layer adapters              |
| Daytona / Archil sandboxes      | Tool handlers in Swirls, not in Looms core                       |

## Suggested dogfood path

1. **Agent sessions first** — `createRuntime({ modules: [agent({ definitions: [support] }), approval()] })` for a single Cloud chat path; keep Temporal graphs.
2. Event bridge — map Swirls `execution_events` types onto namespaced catalogs.
3. Projector — write Looms appends into `execution_events` (or dual-write) so existing Cloud UI keeps working.
4. Workflows second — compile graph nodes to `@looms/workflow` nodes that invoke existing activities as effects.
5. Retire Temporal for those paths once crash recovery + HITL + sub-threads match SLOs.

## Adapter sketch

```ts
import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { s2 } from '@looms/s2'

const looms = createLooms({
  modules: [agent({ definitions: agents }), workflow({ definitions: workflows }), approval(), swirlsBilling()],
  store: s2({
    basin: process.env.LOOMS_S2_BASIN!,
    accessToken: process.env.LOOMS_S2_ACCESS_TOKEN!,
  }),
})

await looms.start(support, { channel: 'slack' })
```

## Non-goals for the adapter

- Do not pull Fabric, billing, or platform-db into `@looms/*`.
- Do not require Cloudflare Workers for Looms OSS.
- Swirls DSL (`.swirls`) stays in Swirls; Looms consumes already-resolved definitions and modules.
