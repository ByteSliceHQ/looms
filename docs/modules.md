# Modules

Pick the capabilities your app needs and pass them into `createLooms`. Built-in modules cover agents, workflows, and approvals. Add your own for domain work — charges, tickets, notifications — without forking Looms.

## Built-in

| Package | Use it for | SDK |
|---|---|---|
| `@looms/agent` | Conversational or tool-using LLM agents | `defineAgent`, `defineTool`, spawn other agents or workflows as tools |
| `@looms/workflow` | DAGs: nodes, deps, sleeps, nested runs | `defineWorkflow`; a node can return a value, spawn a child, sleep, or emit effects |
| `@looms/approval` | Human gates from agents or workflows | `gate({ title })` parks the run until `approval.decided` |

Compose only what you need. A payments service might ship workflow + approval + a custom charges module, and skip agents entirely.

## Start a host

```ts
import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { payments } from './modules/payments'
import { assistant, checkout, definitions } from './definitions'
import { llm } from './llm' // an LlmAdapter, see ai-providers.md

export const looms = createLooms({
  definitions,
  modules: [agent({ llm }), workflow(), approval(), payments()],
})

await looms.start(assistant, 'Charge $40 after approval')
await looms.start(checkout, { amount: 150, currency: 'USD' })
```

Omit `modules` to get agent, workflow, and approval. Pass your own list to configure a module (the LLM adapter belongs to `agent({ llm })`), add a domain module, or skip a built-in.

`start` does not care which module owns the definition. An agent and a workflow are two kinds of thread; a module you write adds a third, and `looms.start(myThing, input)` works the same way.

## Talk to a running run

Every input to a run is an event. Modules export small builders so you never hand-write event payloads:

```ts
import { userMessage } from '@looms/agent'
import { decision } from '@looms/approval'

await looms.signal(runId, [userMessage('Also greet Maya')])
await looms.signal(runId, [decision(approvalId, 'approve')])
```

Your module can do the same: export a function that returns an `EventInput`, and callers use it with `signal` or `store.commit`.

## Add your own module

A module declares namespaced events, effects the host should run, and optional projections for the UI. Handlers should be safe to retry — use `ctx.effectId` as an idempotency key.

```ts
import {
  defineEffect,
  defineEventCatalog,
  defineProjection,
  defineRuntimeModule,
} from '@looms/core'
import { z } from 'zod'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

const catalog = defineEventCatalog('payments', {
  'charge.requested': Charge,
  'charge.authorized': Charge,
})

const charge = defineEffect({
  type: 'payments.charge',
  input: z.object({ amount: z.number() }),
  execute: (input, ctx) => [
    {
      type: 'payments.charge.requested',
      payload: { chargeId: ctx.effectId, amount: input.amount },
    },
    {
      type: 'payments.charge.authorized',
      payload: { chargeId: ctx.effectId, amount: input.amount },
    },
  ],
})

export const ledger = defineProjection({
  name: 'ledger',
  initialState: { entries: [] as { chargeId: string; amount: number }[] },
  reduce(state, event) {
    if (event.type !== 'payments.charge.authorized') return state
    return { entries: [...state.entries, event.payload] }
  },
})

export function payments() {
  return defineRuntimeModule({
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: catalog,
    effects: { charge },
    projections: { ledger },
  })
}
```

Prefer a Zod (or other Standard Schema) object for each event so the payload is validated. When you only need a type, `payload<{ chargeId: string }>()` from `@looms/core` declares it without a runtime schema — do not write `{} as { chargeId: string }`.

Workflows invoke `payments.charge` and wait on `payments.charge.authorized`. Agents can expose the same charge as a tool.

Conventions that keep modules composable:

- Event and effect types are namespaced (`payments.charge.authorized`)
- Handlers are idempotent on `ctx.effectId`
- Projections only fold events — they do not perform I/O
- Declare `dependencies` when you wait on another module's events

## Testing

```ts
import { createTestRuntime, assertReplayDeterministic, moduleConformance } from '@looms/testing'

expect(moduleConformance(payments())).toEqual([])
const test = await createTestRuntime([payments()])
await assertReplayDeterministic(test, runId)
```
