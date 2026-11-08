# Modules

Pick the capabilities your app needs and pass them into `createLooms`. Built-in modules cover agents, workflows, approvals, and evaluations. Add your own for domain work — charges, tickets, notifications — without forking Looms.

## Built-in

| Package                   | Use it for                              | SDK                                                                                |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `@swirls/looms/agent`     | Conversational or tool-using LLM agents | `defineAgent`, `defineTool`, spawn other agents or workflows as tools              |
| `@swirls/looms/workflow`  | DAGs: nodes, deps, sleeps, nested runs  | `defineWorkflow`; a node can return a value, spawn a child, sleep, or emit effects |
| `@swirls/looms/approval`  | Human gates from agents or workflows    | `gate({ title })` parks the run until `approval.decided`                           |
| `@swirls/looms/evaluator` | Typed questions that branch a run       | `defineEvaluator`, `evaluate()`, spawn as a child                                  |
| `@swirls/looms/schedule`  | Cron, interval, or one-shot fires       | `defineSchedule`, `ensureSchedule`, `pause` / `resume` / `retire`                  |

Compose only what you need. A payments service might ship workflow + approval + a custom charges module, and skip agents entirely.

## Start a host

```ts
import { agent } from '@swirls/looms/agent'
import { approval } from '@swirls/looms/approval'
import { workflow } from '@swirls/looms/workflow'
import { createLooms } from '@swirls/looms/runtime'
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

`defineWorkflow({ childExecution: 'run' })` launches each spawned, mapped, or looped child as its own run instead of a thread in the parent. The child run id is derived from the parent run and the child thread id, so a retry finds the same run. The child appends `runtime.child.settled` to the parent when it finishes, and that event completes the parent's wait. `childClose: 'terminate'` (the default) cancels those runs when the parent is cancelled. `childClose: 'wait'` cancels the children first and cancels the parent only after they have finished. A missing `RunLauncher` fails the launch. The default `childExecution` is `'thread'`, which keeps the child inside the parent run.

`defineModule(options, setup)` returns a complete runtime module. The callback receives typed `effect`, `projection`, `thread`, `input`, and `emit` builders. Only returned members are installed; access them through `payments.effects.charge` and `payments.projections.ledger`. Event schemas can be inline or supplied as a reusable `defineEventCatalog`.

Modules that implement a custom thread kind can return `definitions` alongside `threads`. The runtime gathers these for `start`, HTTP starts, and cross-module child spawning.

`defineAgent` and `defineWorkflow` are specialized helpers. For your own kind, stamp the definition with `createKind` (or `defineKind`) instead of assembling `{ kind, name }` by hand:

```ts
import { createKind } from '@swirls/looms/core'

const auction = createKind('auction')

export const vintageWatch = auction.define({
  name: 'vintage-watch',
  input: AuctionInput,
})
```

The module still implements `m.thread({ kind: 'auction', ... })`. The builder only types the startable definition; it does not replace `defineModule`. `defineEvaluator` is that helper bound to `'evaluator'`, plus questions and routing. Pass a model id such as `typesafe-ai/jev` on the definition.

## Talk to a running run

Every input to a run is an event. Modules export small builders so you never hand-write event payloads:

```ts
import { userMessage } from '@swirls/looms/agent'
import { decision } from '@swirls/looms/approval'

await looms.signal(runId, [userMessage('Also greet Maya')])
await looms.signal(runId, [decision(approvalId, 'approve')])
```

`userMessage` and `decision` are **signals**: event builders for code outside the run. Your module declares its own on `signals`. Code inside a run uses **steps** instead, such as `approval.steps.gate`. Steps return effects, not events. The next section explains the difference.

## Add your own module

A module is one file you can read top to bottom. It holds the facts it records, the work it performs, how outside callers and runs talk to it, and the state it derives. This payments module submits a charge, waits for the provider to confirm it, and keeps a ledger. The handler simulates the provider call; a real one would call the provider with `ctx.effectId` as the idempotency key.

```ts
import { z } from 'zod'

import { defineModule, invoke, wait } from '@swirls/looms/core'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

const Ledger = z.object({
  charges: z.record(
    z.string(),
    z.object({ amount: z.number(), status: z.enum(['requested', 'authorized']) }),
  ),
})

type Ledger = z.infer<typeof Ledger>

export const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    description: 'Card charges and the ledger folded from them.',
    // Events: facts in the run log, named in the past tense.
    events: {
      'charge.requested': Charge,
      'charge.authorized': Charge,
    },
  },
  (m) => {
    // Effect: work the host performs. It submits the charge and records that it did.
    const charge = m.effect({
      type: 'payments.charge',
      placement: 'local',
      input: Charge,
      execute: (input) => [{ type: 'payments.charge.requested', payload: input }],
    })

    return {
      effects: { charge },

      // Signals: events from outside the run. The provider's webhook confirms a charge.
      signals: {
        chargeAuthorized: (chargeId: string, amount: number) =>
          m.input('charge.authorized', { chargeId, amount }),
      },

      // Steps: effects a thread or workflow node returns. Charge, then park until confirmed.
      steps: {
        chargeAndAwait: (chargeId: string, amount: number) => [
          invoke(charge, { chargeId, amount }),
          wait({
            waitId: `charge_${chargeId}`,
            on: { type: 'payments.charge.authorized', match: { chargeId } },
          }),
        ],
      },

      // Projection: state folded from events, for UIs and queries.
      projections: {
        ledger: m.projection({
          name: 'ledger',
          shape: Ledger,
          initialState: { charges: {} },
          reduce(state, event): Ledger {
            if (
              event.type !== 'payments.charge.requested' &&
              event.type !== 'payments.charge.authorized'
            ) {
              return state
            }

            const { chargeId, amount } = event.payload
            const status = event.type === 'payments.charge.requested' ? 'requested' : 'authorized'

            return { charges: { ...state.charges, [chargeId]: { amount, status } } }
          },
        }),
      },

      // Examples: traces moduleConformance folds against the projections.
      examples: [
        {
          name: 'a webhook authorizes a requested charge',
          events: [
            m.input('charge.requested', { chargeId: 'ch_1', amount: 40 }),
            m.input('charge.authorized', { chargeId: 'ch_1', amount: 40 }),
          ],
          projections: {
            ledger: { charges: { ch_1: { amount: 40, status: 'authorized' } } },
          },
        },
      ],
    }
  },
)

export const { charge } = payments.effects
export const { chargeAuthorized } = payments.signals
export const { chargeAndAwait } = payments.steps
export const { ledger } = payments.projections
```

`description` is published on `GET /definitions`. The host installs effects, threads, and projections. Signals, steps, and examples are not installed: signals and steps are functions that callers import, and `moduleConformance` checks examples.

### Events, effects, signals, and steps

A run stores only events. Every other member of a module puts events on the log or reads them. When you add a member, first decide whether code inside the run uses it or code outside the run does.

- **Events** are facts, named in the past tense. `charge.requested` means the module asked the provider for a charge. `charge.authorized` means the provider confirmed it. Events are immutable and make up the entire run log.
- **Effects** are work the host performs for a run. A reducer cannot call Stripe, so it returns `invoke(charge, input)`. The host runs `execute`, retries it under the retry policy, and appends the events the handler returns. A handler records what it did, not what someone else decides later: `charge` appends `charge.requested` and nothing more.
- **Signals** carry facts that originate outside the run. The provider learns the charge went through, and its webhook calls `looms.signal(runId, [payments.signals.chargeAuthorized(chargeId, amount)])`. A signal only builds a typed event: it does no IO, and the runtime never calls it.
- **Steps** package the module's protocol for code inside a run. `chargeAndAwait` returns an `invoke` followed by a `wait` matched on `chargeId`. A workflow node can charge and park without knowing event names or match keys. Like a reducer, a step only describes effects; the runtime records and runs them after the node returns.
- **Projections** fold events into state for UIs and queries. `ledger` shows each charge as `requested` or `authorized`.

| Member        | Returns                  | Used by                                       | Through                                  |
| ------------- | ------------------------ | --------------------------------------------- | ---------------------------------------- |
| `events`      | Payload schemas          | Every other member                            | `m.input`, reducers, `wait` matchers     |
| `effects`     | Events, from the handler | The host, when a run asks                     | `invoke(effect, input)`                  |
| `signals`     | Events                   | Code outside the run: webhooks, UIs, services | `looms.signal`, `store.commit`           |
| `steps`       | Effects                  | Code inside the run: threads, workflow nodes  | `ctx.effects(...)`, a thread's `effects` |
| `projections` | State                    | UIs, queries, tests                           | `looms.project`, projectors              |

Events enter a run two ways. Effect handlers append them from inside the run, and signals append them from outside. Steps are how a run asks for work. Signals are how the outside world reports what happened. Because signals return events and steps return effects, `defineModule` rejects a signal that returns an effect and a step that returns an event.

A checkout workflow uses the step, and the provider's webhook uses the signal:

```ts
import { defineWorkflow } from '@swirls/looms/workflow'
import { payments } from './modules/payments'

export const checkout = defineWorkflow({
  name: 'checkout',
  input: z.object({ orderId: z.string(), amount: z.number() }),
  nodes: [
    {
      id: 'charge',
      run: (ctx) =>
        ctx.effects(payments.steps.chargeAndAwait(`ch_${ctx.input.orderId}`, ctx.input.amount)),
    },
  ],
})

// The provider's webhook, after verifying the request:
await looms.signal(runId, [payments.signals.chargeAuthorized(chargeId, amount)])
```

Here is the run, event by event:

1. The `charge` node returns the step's `invoke` and `wait`.
2. The host runs `charge`, which appends `payments.charge.requested`. The ledger shows the charge as `requested`.
3. The run parks on the wait. It holds no process open, so it can wait minutes or days.
4. The webhook signals `payments.charge.authorized`. Its `chargeId` matches the wait, so the node finishes and the workflow completes. The ledger shows the charge as `authorized`.

Where a new piece belongs:

- Something happened that you need to record, replay, or react to: add an **event**.
- A run needs IO, such as an API call, an email, or a model call: add an **effect** whose handler returns the events that describe what it did.
- Code outside the run learns a fact, such as a webhook, a button click, or a reply: add a **signal**, so callers never hand-write the event type or payload.
- Thread and node authors would otherwise repeat the same `invoke`, `wait`, or `spawn` sequence: add a **step**.
- A UI or query needs current state: add a **projection**. Do not add an effect that reads it.

`examples` tie it together. Each one is a short event trace and the state each projection should fold to, keyed by projection member key. `moduleConformance` validates the events against the catalog and folds them the way the runtime does, so the example doubles as a test and as documentation. Literal states such as `status: 'authorized'` type-check without `as const`.

Prefer a Zod (or other Standard Schema) object for each event so the payload is validated. When you only need a type, `payload<{ chargeId: string }>()` from `@swirls/looms/core` declares it without a runtime schema — do not write `{} as { chargeId: string }`.

Agents can expose the same `charge` effect as a tool.

## File layout

Built-in modules (`@swirls/looms/agent`, `@swirls/looms/workflow`, `@swirls/looms/approval`, `@swirls/looms/evaluator`) use separate files for larger modules. Open the folder and the names tell you where to look:

```
src/
  events.ts        # namespaced event catalog
  threads.ts       # thread kinds (omit if the module has none)
  effects.ts       # host-side effect handlers
  projections.ts   # read models
  signals.ts       # signals: event builders for callers outside the run
  steps.ts         # steps: effect composers for threads and workflow nodes
  scope.ts         # createModuleScope for shared typed builders
  module.ts        # defineModule(options, setup) assembly
  debugger/        # DebuggerPlugin; a separate entry so the host does not import React
  index.ts         # public re-exports
```

A small domain module can stay in one callback. Larger modules can use `createModuleScope(options)` in `scope.ts` to author members across files, then return those members from `defineModule(scope, setup)` in `module.ts`. The scope is an authoring helper; pass the finished module to the host.

`effects.ts` is part of the host bundle. A worker effect's definition can live there; its handler belongs in the consumer, bound with `workerHandlers`.

### Effects in their own file

`scope.effect` takes the same fields as `m.effect` and checks them against the same catalog, so an effect can live in `effects.ts` and keep its types:

```ts
// events.ts
import { defineEventCatalog } from '@swirls/looms/core'
import { z } from 'zod'

export const paymentsEvents = defineEventCatalog('payments', {
  recorded: z.object({ chargeId: z.string(), amount: z.number() }),
})
```

```ts
// scope.ts
import { createModuleScope } from '@swirls/looms/core'
import { paymentsEvents } from './events'

export const paymentsScope = createModuleScope({
  namespace: 'payments',
  protocolVersion: '1.0.0',
  events: paymentsEvents,
})
```

```ts
// effects.ts
import { z } from 'zod'
import { paymentsScope } from './scope'

export const recordPaymentEffect = paymentsScope.effect({
  type: 'payments.record',
  placement: 'local',
  input: z.object({ amount: z.number() }),
  execute: (input, ctx) => [
    { type: 'payments.recorded', payload: { chargeId: ctx.effectId, amount: input.amount } },
  ],
})
```

```ts
// module.ts
import { defineModule } from '@swirls/looms/core'
import { recordPaymentEffect } from './effects'
import { paymentsScope } from './scope'

export const payments = defineModule(paymentsScope, () => ({
  effects: { recordPayment: recordPaymentEffect },
}))
```

`payments.effects.recordPayment` has the same type as `recordPaymentEffect`, so `invoke(payments.effects.recordPayment, { amount: 40 })` still checks its input. `defineModule` rejects an effect whose events fall outside the module's catalog and `observes`. That covers effects built with another module's scope and unscoped `defineEffect` handlers that return untyped events.

`defineEffect` is the unscoped primitive under `m.effect` and `scope.effect`. It takes the same `placement` field, but it has no catalog, so returned events are only checked against `EventInput`. Use it for effects that emit nothing or belong to no module.

Conventions that keep modules composable:

- Event and effect types are namespaced (`payments.charge.authorized`)
- Handlers are idempotent on `ctx.effectId`
- Projections only fold events — they do not perform I/O
- Declare `dependencies` when you wait on another module's events
- Put each module slot in its own file once the module is more than a sketch
- Pass `input` or `shape` (a Standard Schema or Effect Schema) to `define*` and let types infer — do not pass generics

## Effect placement

Every effect sets `placement` when you define it, and the field changes what the definition accepts:

| `placement` | Runs in                                         | Handler                                          | `emit`                                       |
| ----------- | ----------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| `'local'`   | Host actor cell (e.g. Durable Object)           | `execute` on the definition (required)           | Live — subscribers see events as they append |
| `'worker'`  | External `EffectWorker` (e.g. Cloudflare Queue) | `workerHandlers([[def, handler]])`; no `execute` | Buffered until the attempt completes         |

The host and the consumer are separate programs, and both of them import the effect definition. The host imports it to register the effect, typecheck `invoke`, and route the attempt to a queue. The consumer imports it and binds the handler with `workerHandlers([[definition, handler]])`, which checks the queued input against the effect's schema before the handler runs.

A `handler` field on the definition is part of the host's import, so the host bundle would include the handler and its dependencies, such as a sandbox runtime or a vendor SDK. The host sends a worker attempt to the queue. An attempt that runs in the host actor cell instead fails.

The definition carries the type, the input schema, and the retry policy. Keep the handler in the consumer you deploy, and a v1 fleet can finish in-flight `payments.charge` attempts while a v2 fleet handles `payments.charge@v2`.

A local effect without `execute`, a worker effect with one, or an effect with no `placement` fails to compile. The host does not infer placement from a missing `execute`, and queue routes do not take overlapping type-string `handles` lists. Pass the worker definitions into the route:

```ts
const sandboxExec = sandboxScope.effect({
  type: 'sandbox.exec',
  placement: 'worker',
  retry: { maxAttempts: 3, scheduleToStartTimeoutMs: 60_000 },
})

cloudflareQueueWorker({
  routes: [{ effects: [sandboxExec], queue: env.SANDBOX_QUEUE }],
})
```

Bind the handler in the consumer, which imports the same definition. Pass `handlers` to `queueConsumer` or `createQueuePullConsumer`:

```ts
import { workerHandlers } from '@swirls/looms/cloudflare'

const handlers = workerHandlers([[sandboxExec, runSandbox]])
```

`onEffect` middleware accepts only local definitions. `onAdmit` accepts either. `GET /definitions/effects` lists every declared effect, including `placement`, retry policy, and input schema. `runtime.effectPlacements` is the in-process placement map. `inspectRun` / `GET /runs/:id/effects` include each outstanding effect's `placement`. Dual local/worker placement for one definition is a separate follow-up; pick local or worker at define time.

## Effect admission and middleware

Modules may declare **`admission`**: hooks that run in the host **before every local attempt and before every worker dispatch**. Use them for gates that must cover both paths — tenant credit checks, feature flags, allowlists. Prefer `onAdmit` for one effect type, and `failEffect` to reject the attempt under the retry policy:

```ts
import { Effect } from 'effect'
import { callLlmEffect } from '@swirls/looms/agent'
import { defineRuntimeModule, failEffect, onAdmit } from '@swirls/looms/core'

const billing = defineRuntimeModule({
  namespace: 'billing',
  protocolVersion: '1.0.0',
  admission: [
    onAdmit(callLlmEffect, (_input, ctx) => {
      if (!hasCredits(ctx.attributes.orgId)) {
        return failEffect({ error: 'credits exhausted', nonRetryable: true })
      }

      return Effect.void
    }),
  ],
})
```

`failEffect` from admission becomes `runtime.effect.failed` the same way a handler failure does. A rejected worker admission never queues or dispatches the attempt.

Modules may also declare **`middleware`**: functions that wrap **local** effect dispatch only. They run for every effect the host executes in the actor cell, including built-in ones such as `agent.callLLM`. `onEffect` is typed to accept only `placement: 'local'` definitions, so attaching middleware to a worker effect is a compile error. Use `admission` for shared gates, or wrap execution on the worker side (`workerHandlers`).

Use middleware for concerns that need to wrap the handler itself (timing, rewriting outcomes).

For usage and billing totals, fold `agent.turn.usage` or use the agent module's `tokenUsage` projection.

Install admission or middleware by composing a module that declares them — a module may ship either alone, with no threads or effects of its own.

## Testing

```ts
import {
  createTestRuntime,
  assertReplayDeterministic,
  moduleConformance,
} from '@swirls/looms/testing'

expect(moduleConformance(payments)).toEqual([])
const test = await createTestRuntime([payments])
await assertReplayDeterministic(test, runId)
```

`moduleConformance` also folds each `examples` trace (including payload checks against the module catalogs). A debugger plugin stays on the package's `/debugger` subpath. `debuggerConformance` checks that the plugin name is the module namespace, every catalog event has a family, and every projection is a pane or listed in `headlessProjections`.

```ts
import { approval } from '@swirls/looms/approval'
import { approvalDebugger } from '@swirls/looms/approval/debugger'
import { debuggerConformance } from '@swirls/looms/debugger'

expect(debuggerConformance(approval(), approvalDebugger)).toEqual([])
```
