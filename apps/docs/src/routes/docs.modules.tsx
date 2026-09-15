import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { ConceptFigure } from '../illustrations/illustration'

export const Route = createFileRoute('/docs/modules')({
  component: Modules,
})

function Modules() {
  return (
    <>
      <h1>Modules</h1>
      <p>
        Looms is composable the way a package manager is composable: you install capabilities, not a
        monolith. Built-in modules cover agents, workflows, and approvals. Add your own for domain
        work — charges, tickets, notifications — without forking the runtime.
      </p>
      <p>
        The kernel does not special-case LLM turns or DAG nodes. Those are{' '}
        <strong>thread kinds</strong> contributed by modules, alongside namespaced events, effects,
        and projections. That is what makes an agent spawning a checkout workflow that waits on a
        human gate feel like one system instead of three frameworks glued together.
      </p>

      <ConceptFigure name="modules" />

      <h2>What you get out of the box</h2>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Use it for</th>
            <th>SDK</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@looms/agent</code>
            </td>
            <td>Conversational or tool-using LLM agents</td>
            <td>
              <code>defineAgent</code>, <code>defineTool</code>, spawn other agents or workflows as
              tools
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/workflow</code>
            </td>
            <td>DAGs: nodes, deps, sleeps, nested runs</td>
            <td>
              <code>defineWorkflow</code>; a node can return a value, spawn a child, sleep, or emit
              effects
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/approval</code>
            </td>
            <td>Human gates from agents or workflows</td>
            <td>
              <code>gate({'{ title }'})</code> parks the run until <code>approval.decided</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Compose only what you need. A payments service might ship workflow + approval + a custom
        charges module, and skip agents entirely.
      </p>

      <h2>Configuring modules on a host</h2>
      <p>
        Whether you run inside an in-process host with <code>createLooms</code>, local actors with{' '}
        <code>createLocalActorHost</code>, or edge cells with <code>LoomsDurableObject</code>,
        modules configure identically:
      </p>
      <CodeBlock lang="ts">{`import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { payments } from './modules/payments'
import { assistant, checkout } from './definitions'
import { llm } from './llm'

export const looms = createLooms({
  modules: [agent({ definitions: [assistant], llm }), workflow({ definitions: [checkout] }), approval(), payments],
})

await looms.start(assistant, 'Charge $40 after approval')
await looms.start(checkout, { amount: 150, currency: 'USD' })`}</CodeBlock>
      <p>
        Pass every module you need explicitly — <code>agent()</code>, <code>workflow()</code>,{' '}
        <code>approval()</code>, and any domain modules. Configure modules in that list (e.g.
        providing an LLM adapter to <code>{'agent({ llm })'}</code>). Omitting{' '}
        <code>modules</code> leaves the runtime with no built-in kinds.
      </p>
      <p>
        <code>start</code> does not care which module owns the definition. An agent and a workflow
        are two kinds of thread; a module you write adds a third, and{' '}
        <code>looms.start(myDefinition, input)</code> works the same way.
      </p>

      <h3>Definitions belong to modules</h3>
      <p>
        Pass named agents to <code>{'agent({ definitions: [assistant], llm })'}</code> and named
        workflows to <code>{'workflow({ definitions: [checkout] })'}</code>. The host gathers their
        definitions automatically. Include child definitions in their owning modules too.
        Effects-only modules such as payments or approval need no definitions.
      </p>
      <p>
        Initialization rejects duplicate kind/name registrations and definitions whose kind the
        owning module does not implement. Starting or spawning an unregistered definition fails
        explicitly. The callback form returns a finished module: only returned members are
        installed, and they are exposed through its effects, projections, and threads properties.
      </p>
      <h2>Talk to a running run</h2>
      <p>
        Every input to a run is an event. Modules export small builders so you never hand-write
        payloads:
      </p>
      <CodeBlock lang="ts">{`import { userMessage } from '@looms/agent'
import { decision } from '@looms/approval'

await looms.signal(runId, [userMessage('Also greet Maya')])
await looms.signal(runId, [decision(approvalId, 'approve')])`}</CodeBlock>
      <p>
        Your module can do the same: export a function that returns an <code>EventInput</code>, and
        callers use it with <code>signal</code> or <code>store.commit</code>.
      </p>

      <h2>Add your own module</h2>
      <p>
        A module declares namespaced events, effects the host should run, and optional projections
        for the UI. Weave them together using <code>defineModule</code> so event types, payloads,
        and effects are inferred and type-safe end-to-end. Handlers should be safe to retry — use{' '}
        <code>ctx.effectId</code> as an idempotency key.
      </p>
      <CodeBlock lang="ts">{`import { defineModule } from '@looms/core'
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
export const { ledger } = payments.projections`}</CodeBlock>
      <h3>What the scope gives you</h3>
      <ul>
        <li>
          <strong>Typed events:</strong> <code>event.type</code> and <code>event.payload</code> are
          narrowed inside thread <code>step</code> and projection <code>reduce</code> based on the
          module&apos;s catalog.
        </li>
        <li>
          <strong>Typed returns and emit:</strong> <code>execute</code> return values and{' '}
          <code>ctx.emit</code> are checked against the module&apos;s catalog events.
        </li>
        <li>
          <strong>Typed invoke:</strong> <code>invoke(effectDef, input)</code> statically
          type-checks inputs against the effect&apos;s input schema.
        </li>
        <li>
          <strong>Compile-time service checks:</strong> <code>defineModule</code> requires satisfying
          the environment requirements (<code>R</code>) of all constituent effects via Effect
          Layers.
        </li>
        <li>
          <strong>Runtime payload validation:</strong> Events entering the runtime (via signals or
          effect outcomes) are validated against catalog schemas at runtime.
        </li>
      </ul>
      <p>
        Prefer a Zod (or other Standard Schema) object for each event so the payload is validated.
        When you only need a type, <code>payload{'<{ chargeId: string }>()'}</code> from{' '}
        <code>@looms/core</code> declares it without a runtime schema.
      </p>
      <p>
        Workflows invoke <code>payments.charge</code> and wait on{' '}
        <code>payments.charge.authorized</code>. Agents can expose the same charge as a tool. See{' '}
        <Link to="/docs/examples">Examples</Link> for definitions and a React ledger.
      </p>

      <h2>Defining Effects</h2>
      <p>
        In an event-sourced architecture, state machines and reducers must stay strictly pure and
        deterministic. Side effects — interacting with external APIs, charging credit cards, calling
        LLMs, querying databases, sending emails, or triggering webhooks — must never run inside
        reducers. Instead, reducers declare intent by requesting <strong>effects</strong>.
      </p>
      <p>
        The host runtime executes requested effects outside the state machine, catches transient
        failures with configurable retry policies, and writes the resulting outcome events back onto
        the Run&apos;s durable log.
      </p>

      <h3>Anatomy of an Effect Handler</h3>
      <p>
        Define effects within a module using <code>scope.effect</code> (or standalone with{' '}
        <code>defineEffect</code> from <code>@looms/core</code>). Using <code>scope.effect</code>{' '}
        constrains the effect&apos;s type name to your module&apos;s namespace and ensures that both
        the returned events and any events passed to <code>ctx.emit</code> match your module&apos;s
        event catalog:
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { createModuleScope } from '@looms/core'
import { paymentsCatalog } from './events'

const paymentsScope = createModuleScope({
  namespace: 'payments',
  protocolVersion: '1.0.0',
  events: paymentsCatalog,
})

const ChargeCardInput = z.object({
  customerId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
})

export const chargeCardEffect = paymentsScope.effect({
  type: 'payments.chargeCard',
  input: ChargeCardInput,
  retry: {
    maxAttempts: 3,
    backoffMs: 250,
    maxBackoffMs: 2000,
  },
  execute: async (input, ctx) => {
    // 1. input is pre-validated by ChargeCardInput
    // 2. ctx.effectId is unique and stable across retries — pass as idempotency key
    const charge = await stripe.charges.create(
      {
        customer: input.customerId,
        amount: Math.round(input.amount * 100),
        currency: input.currency.toLowerCase(),
      },
      { idempotencyKey: ctx.effectId },
    )

    // 3. Return event inputs to commit to the log (payloads are validated against catalog)
    return [
      {
        type: 'payments.charge.authorized',
        payload: {
          chargeId: charge.id,
          amount: input.amount,
          currency: input.currency,
        },
      },
    ]
  },
})`}</CodeBlock>

      <h3>Input Validation</h3>
      <p>
        Pass a Standard Schema V1 validator (Zod, Effect Schema, Valibot, or ArkType) to{' '}
        <code>input</code>. The runtime automatically parses and validates incoming arguments before
        invoking the handler. If an invalid input is passed, execution fails immediately with an{' '}
        <code>InvalidInputError</code> before calling any external services. The schema also
        establishes the TypeScript input type for both the handler and caller-side{' '}
        <code>invoke(chargeCardEffect, input)</code>.
      </p>

      <h3>The Effect Context &amp; Idempotency</h3>
      <p>
        Every handler receives an <code>EffectContext</code> providing metadata and runtime tools:
      </p>
      <ul>
        <li>
          <strong>
            <code>ctx.effectId</code>:
          </strong>{' '}
          A unique, deterministic identifier for this effect invocation.{' '}
          <em>
            Always pass <code>ctx.effectId</code> as an idempotency key
          </em>{' '}
          when communicating with external APIs (Stripe, GitHub, payment gateways) or writing to
          databases. If an actor cell crashes or fails over mid-execution, the replacement actor can
          safely re-run the effect without producing duplicate external side effects.
        </li>
        <li>
          <strong>
            <code>ctx.runId</code> &amp; <code>ctx.threadId</code>:
          </strong>{' '}
          Identifiers of the enclosing run and calling thread.
        </li>
        <li>
          <strong>
            <code>ctx.causingEventId</code>:
          </strong>{' '}
          The sequence ID of the event that caused this effect to be requested, preserving the
          causal provenance graph.
        </li>
        <li>
          <strong>
            <code>ctx.emit(event)</code>:
          </strong>{' '}
          Stream intermediate events to the log while the handler is still executing.
        </li>
      </ul>

      <h3>Three Execution Styles: Sync, Async, and Effect-TS</h3>
      <p>
        Looms effect handlers can return three shapes depending on your application&apos;s needs:
      </p>
      <div className="my-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="border-line/40 rounded-lg border p-4">
          <h4 className="text-foreground mt-0 text-[0.95rem] font-semibold">1. Synchronous</h4>
          <p className="text-muted mb-2 text-[0.88rem]">
            For pure calculations, token counting, or instantaneous transformations.
          </p>
          <CodeBlock lang="ts">{`execute: (input, ctx) => [
  {
    type: 'payments.computed',
    payload: { tax: input.amount * 0.08 },
  },
]`}</CodeBlock>
        </div>

        <div className="border-line/40 rounded-lg border p-4">
          <h4 className="text-foreground mt-0 text-[0.95rem] font-semibold">2. Async / Promise</h4>
          <p className="text-muted mb-2 text-[0.88rem]">
            For standard async/await I/O, fetch requests, or third-party SDK calls.
          </p>
          <CodeBlock lang="ts">{`execute: async (input, ctx) => {
  const res = await fetch(...)
  return [{ ... }]
}`}</CodeBlock>
        </div>

        <div className="border-line/40 rounded-lg border p-4">
          <h4 className="text-foreground mt-0 text-[0.95rem] font-semibold">
            3. Effect-TS &amp; Services
          </h4>
          <p className="text-muted mb-2 text-[0.88rem]">
            For typed dependencies, structured concurrency, and compile-time service checking.
          </p>
          <CodeBlock lang="ts">{`execute: (input, ctx) =>
  Effect.gen(function* () {
    const db = yield* DatabaseTag
    return [{ ... }]
  })`}</CodeBlock>
        </div>
      </div>

      <h3>Managing Dependencies with Effect Layers</h3>
      <p>
        When an effect uses <code>Effect.gen</code> and yields dependencies (e.g.{' '}
        <code>yield* DatabaseTag</code> or <code>yield* LlmTag</code>), TypeScript tracks the
        required service environment in the effect&apos;s type signature.
      </p>
      <p>
        When you call <code>defineModule</code>, Looms inspects the service requirements of all
        registered effects. If any required service is missing, the build will fail to compile until
        you supply a matching <code>Layer</code>:
      </p>
      <CodeBlock lang="ts">{`import { Context, Effect, Layer } from 'effect'
import { defineModule } from '@looms/core'
import { z } from 'zod'

export interface DatabaseService {
  insertCharge(chargeId: string, amount: number): Promise<void>
}
export class DatabaseTag extends Context.Service<DatabaseTag, DatabaseService>()('app/Database') {}

export function payments(db: DatabaseService) {
  return defineModule({ namespace: 'payments', protocolVersion: '1.0.0' }, (m) => ({
    effects: {
      recordInDb: m.effect({
        type: 'payments.recordInDb',
        input: z.object({ amount: z.number() }),
        execute: (input, ctx) => Effect.gen(function* () {
          const database = yield* DatabaseTag
          yield* Effect.tryPromise(() => database.insertCharge(ctx.effectId, input.amount))
          return []
        }),
      }),
    },
    services: () => Layer.succeed(DatabaseTag, db),
  }))
}`}</CodeBlock>

      <h3>
        Live Event Streaming with <code>ctx.emit</code>
      </h3>
      <p>
        Some effects take time to finish and produce a stream of partial results — for example,
        streaming LLM tokens back to the user or reporting step-by-step progress during a batch
        migration. Use <code>ctx.emit(event)</code> to append events to the live log before the
        effect completes:
      </p>
      <CodeBlock lang="ts">{`const downloadAndProcessEffect = m.effect({
  type: 'payments.downloadBatch',
  input: z.object({ batchUrl: z.string() }),
  execute: async (input, ctx) => {
    // Stream progress events as chunks arrive:
    for await (const chunk of fetchChunks(input.batchUrl)) {
      await ctx.emit({
        type: 'payments.progress',
        payload: { bytesRead: chunk.length },
      })
    }

    return [{ type: 'payments.batchCompleted', payload: { finished: true } }]
  },
})`}</CodeBlock>
      <p>
        With <code>m.effect</code>, events passed to <code>ctx.emit</code> are checked at
        compile time against your module&apos;s catalog and validated against their schemas at
        runtime.
      </p>

      <h3>Retry Policies &amp; Failure Handling</h3>
      <p>
        External networks and third-party APIs fail. Pass a <code>retry</code> policy to
        automatically retry transient failures using exponential backoff:
      </p>
      <CodeBlock lang="ts">{`export const callGatewayEffect = paymentsScope.effect({
  type: 'payments.callGateway',
  retry: {
    maxAttempts: 4,     // Retry up to 4 times
    backoffMs: 200,     // Initial backoff
    maxBackoffMs: 3000, // Maximum cap
  },
  execute: async (input, ctx) => {
    // If this throws or returns a failed Effect, Looms retries up to 4 times.
    return await sendWithNetworkTimeout(input)
  },
})`}</CodeBlock>
      <p>
        If all retry attempts fail, the host converts the error into a durable{' '}
        <code>runtime.effect.failed</code> event on the log containing the <code>effectId</code> and
        error message. Threads and workflows can match on <code>runtime.effect.failed</code> to
        transition state, trigger compensations, or escalate to human review.
      </p>

      <h3>
        Type-Safe Invocations with <code>invoke</code>
      </h3>
      <p>
        To invoke an effect from a thread reducer or a workflow node, pass the effect definition
        directly to <code>invoke</code>:
      </p>
      <CodeBlock lang="ts">{`import { invoke } from '@looms/core'
import { chargeCardEffect } from './effects'

// Inside a thread's effects() method:
effects(state, ctx) {
  if (state.status === 'ready_to_charge') {
    return [
      invoke(
        chargeCardEffect,
        {
          customerId: state.customerId,
          amount: state.totalAmount, // Statically typed! Missing or mistyped keys fail compilation
        },
        \`charge_\${state.orderId}\`,
      ),
    ]
  }
  return []
}`}</CodeBlock>

      <h2>File layout</h2>
      <p>
        Built-in modules assemble separately authored members with <code>defineModule</code>. Open the folder
        and the names tell you where to look:
      </p>
      <CodeBlock lang="text">{`src/
  events.ts        # namespaced event catalog
  scope.ts         # createModuleScope for shared typed builders
  threads.ts       # thread kinds (omit if the module has none)
  effects.ts       # host-side effect handlers
  projections.ts   # read models
  signals.ts       # builders for looms.signal / store.commit
  module.ts        # defineModule(options, setup) assembly
  index.ts         # public re-exports`}</CodeBlock>
      <p>
        Small modules can stay in one callback. For larger modules, export a shared
        <code>createModuleScope(options)</code> from <code>scope.ts</code>, author members across
        files, and return them from <code>defineModule(options, setup)</code>. Only the finished
        module is passed to the host.
      </p>

      <h2>Module Composition Principles</h2>
      <p>
        To ensure packages from different teams or authors interoperate reliably, modules follow
        explicit architectural rules:
      </p>
      <ul>
        <li>
          <strong>Stable namespaces:</strong> Every module defines a unique namespace (e.g.{' '}
          <code>agent</code>, <code>workflow</code>, <code>payments</code>). Event and effect type
          names are scoped to prevent collision.
        </li>
        <li>
          <strong>Open-world event catalogs:</strong> Applications do not maintain a gigantic
          central event union. Installing modules composes their typed event catalogs automatically.
        </li>
        <li>
          <strong>Universal thread kinds:</strong> The runtime kernel knows nothing about agents or
          DAGs. Kinds are open-ended; <code>agent</code> and <code>workflow</code> are simply kinds
          contributed by modules.
        </li>
        <li>
          <strong>Observational freedom:</strong> While behavioral reducers own their thread&apos;s
          state, projection reducers may freely observe events across multiple modules (for example,
          a financial ledger observing both payment events and LLM token usage).
        </li>
        <li>
          <strong>Idempotent effect execution:</strong> Effect handlers receive{' '}
          <code>ctx.effectId</code>. Handlers must use this ID as an idempotency key when
          interacting with external APIs (like Stripe or GitHub) to guarantee safe retries after
          network hiccups.
        </li>
        <li>
          <strong>
            Inferred <code>define*</code> types:
          </strong>{' '}
          Pass <code>input</code> or <code>shape</code> (a Standard Schema or Effect Schema). The
          factory infers handler and state types — do not pass generics.
        </li>
      </ul>
    </>
  )
}
