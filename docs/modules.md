# Modules

Pick the capabilities your app needs and pass them into `createLooms`. Built-in modules cover agents, workflows, and approvals. Add your own for domain work — charges, tickets, notifications — without forking Looms.

## Built-in

| Package           | Use it for                              | SDK                                                                                |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `@looms/agent`    | Conversational or tool-using LLM agents | `defineAgent`, `defineTool`, spawn other agents or workflows as tools              |
| `@looms/workflow` | DAGs: nodes, deps, sleeps, nested runs  | `defineWorkflow`; a node can return a value, spawn a child, sleep, or emit effects |
| `@looms/approval` | Human gates from agents or workflows    | `gate({ title })` parks the run until `approval.decided`                           |

Compose only what you need. A payments service might ship workflow + approval + a custom charges module, and skip agents entirely.

## Start a host

```ts
import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { payments } from './modules/payments'
import { assistant, checkout } from './definitions'
import { llm } from './llm' // an LlmAdapter, see ai-providers.md

export const looms = createLooms({
  modules: [
    agent({ definitions: [assistant], llm }),
    workflow({ definitions: [checkout] }),
    approval(),
    payments,
  ],
})

await looms.start(assistant, 'Charge $40 after approval')
await looms.start(checkout, { amount: 150, currency: 'USD' })
```

Omit `modules` (or pass `[]`) for a runtime with no built-in kinds — you must pass `agent()`, `workflow()`, `approval()`, and any domain modules you need. Configure a module (the LLM adapter belongs to `agent({ llm })`) in that list.

Each module owns its definitions. `workflow({ definitions: [checkout] })` installs both the workflow machinery and the named workflow. The host has no separate definition list. Custom modules that only supply effects or projections need no definitions.

At initialization, Looms rejects duplicate `(kind, name)` registrations and definitions whose kind is not implemented by their owning module. Starting or spawning an unregistered definition fails before any run events are written. An unsupported thread kind is rejected the same way; if such an event somehow appears in a log, fold marks the thread failed instead of inventing empty state. Pass all child definitions to their owning modules too.

`defineModule(options, setup)` returns a complete runtime module. The callback receives typed `effect`, `projection`, `thread`, `input`, and `emit` builders. Only returned members are installed; access them through `payments.effects.charge` and `payments.projections.ledger`. Event schemas can be inline or supplied as a reusable `defineEventCatalog`.

Modules that implement a custom thread kind can return `definitions` alongside `threads`. The runtime gathers these for `start`, HTTP starts, and cross-module child spawning.

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
import { defineModule } from '@looms/core'
import { z } from 'zod'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

export const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: {
      'charge.requested': Charge,
      'charge.authorized': Charge,
    },
  },
  (m) => ({
    effects: {
      charge: m.effect({
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
      }),
    },
    projections: {
      ledger: m.projection({
        name: 'ledger',
        shape: z.object({
          entries: z.array(Charge),
        }),
        initialState: { entries: [] },
        reduce(state, event) {
          if (event.type !== 'payments.charge.authorized') {
            return state
          }

          return { entries: [...state.entries, event.payload] }
        },
      }),
    },
  }),
)

export const { charge } = payments.effects
export const { ledger } = payments.projections
```

Prefer a Zod (or other Standard Schema) object for each event so the payload is validated. When you only need a type, `payload<{ chargeId: string }>()` from `@looms/core` declares it without a runtime schema — do not write `{} as { chargeId: string }`.

Workflows invoke `payments.charge` and wait on `payments.charge.authorized`. Agents can expose the same charge as a tool.

## File layout

Built-in modules (`@looms/agent`, `@looms/workflow`, `@looms/approval`) use separate files for larger modules. Open the folder and the names tell you where to look:

```
src/
  events.ts        # namespaced event catalog
  threads.ts       # thread kinds (omit if the module has none)
  effects.ts       # host-side effect handlers
  projections.ts   # read models
  signals.ts       # builders for looms.signal / store.commit
  scope.ts         # createModuleScope for shared typed builders
  module.ts        # defineModule(options, setup) assembly
  index.ts         # public re-exports
```

A small domain module can stay in one callback. Larger modules can use `createModuleScope(options)` in `scope.ts` to author members across files, then return those members from `defineModule(options, setup)` in `module.ts`. The scope is an authoring helper; pass the finished module to the host.

Conventions that keep modules composable:

- Event and effect types are namespaced (`payments.charge.authorized`)
- Handlers are idempotent on `ctx.effectId`
- Projections only fold events — they do not perform I/O
- Declare `dependencies` when you wait on another module's events
- Put each module slot in its own file once the module is more than a sketch
- Pass `input` or `shape` (a Standard Schema or Effect Schema) to `define*` and let types infer — do not pass generics

## Testing

```ts
import { createTestRuntime, assertReplayDeterministic, moduleConformance } from '@looms/testing'

expect(moduleConformance(payments)).toEqual([])
const test = await createTestRuntime([payments])
await assertReplayDeterministic(test, runId)
```
