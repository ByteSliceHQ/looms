# Swirls adapter spike

Looms is designed so `swirls-platform` can eventually host agents/workflows on Looms instead of Temporal, without importing Swirls product packages into this repo.

## Mapping today

| Swirls concept | Looms concept |
|---|---|
| `execution_actors` row | Actor `storeId` / S2 stream `actors/{id}` |
| `execution_events` | LoomsEvent log (`@looms/core`) |
| `workflow_execution` | `kind: 'workflow'` |
| `agent_session` | `kind: 'agent'` |
| Temporal `swirlsGraphWorkflow` | Effect wake loop + DAG scheduler (`@looms/workflow`) |
| Temporal signals (`review:*`) | `review.decided` / `agent.turn.steered` append + wake |
| Durable Object live projection | LiveStore / `@looms/livestore` + `/api/livestore` |
| Fabric macaroon / Anvil secrets | **Out of Looms** — inject via Swirls Layer adapters |
| Daytona / Archil sandboxes | Tool handlers in Swirls, not in Looms core |

## Suggested dogfood path

1. **Agent sessions first** — replace `agentSessionWorkflow` with `createLooms().startAgent` for a single Cloud chat path; keep Temporal graphs.
2. Event bridge — map Swirls `execution_events` types ↔ Looms `EventType` (mostly 1:1 names already).
3. Projector — write Looms appends into `execution_events` (or dual-write) so existing Cloud UI keeps working during migration.
4. Workflows second — port `swirlsGraphWorkflow` ready-set semantics onto `@looms/workflow` nodes that call existing `executeNode` activities as tools.
5. Retire Temporal for those paths once crash recovery + HITL + subagents match SLOs.

## Adapter sketch

```ts
// swirls-platform (not in this repo)
import { createLooms } from '@looms/runtime'
import { s2 } from '@looms/s2'

const looms = createLooms({
  store: s2({
    basin: process.env.LOOMS_S2_BASIN!,
    accessToken: process.env.LOOMS_S2_ACCESS_TOKEN!,
  }),
  definitions: [/* resolved from deployment snapshot */],
  llm: swirlsOpenRouterLlm, // Promise-based LlmAdapter wrapping existing agent turn
})

await looms.startAgent('support', { channel: 'slack' })
```

## Non-goals for the adapter

- Do not pull Fabric, billing, or platform-db into `@looms/*`.
- Do not require Cloudflare Workers for Looms OSS.
- Swirls DSL (`.swirls`) stays in Swirls; Looms consumes already-resolved `AgentDefinition` / `WorkflowDefinition` objects.
