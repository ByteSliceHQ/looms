import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/modules')({
  component: Modules,
})

function Modules() {
  return (
    <>
      <h1>Modules</h1>
      <p>
        Pick the capabilities your app needs and pass them into the runtime. Built-in
        modules cover agents, workflows, and approvals. Add your own for domain
        work — charges, tickets, notifications — without forking Looms.
      </p>

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
              <code>defineAgent</code>, <code>defineTool</code>, spawn other
              agents or workflows as tools
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/workflow</code>
            </td>
            <td>DAGs: nodes, deps, sleeps, nested runs</td>
            <td>
              <code>defineWorkflow</code>; a node can return a value, spawn a
              child, sleep, or emit effects
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/approval</code>
            </td>
            <td>Human gates from agents or workflows</td>
            <td>
              <code>gate({'{ title }'})</code> parks the run until{' '}
              <code>approval.decided</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Compose only what you need. A payments service might ship workflow +
        approval + a custom charges module, and skip agents entirely.
      </p>

      <h2>Start a host</h2>
      <pre>
        <code>{`import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { payments } from './modules/payments'
import { assistant, checkout, definitions } from './definitions'
import { llm } from './llm' // an LlmAdapter, see AI providers

export const looms = createLooms({
  definitions,
  modules: [agent({ llm }), workflow(), approval(), payments()],
})

await looms.start(assistant, 'Charge $40 after approval')
await looms.start(checkout, { amount: 150, currency: 'USD' })`}</code>
      </pre>
      <p>
        Omit <code>modules</code> to get agent, workflow, and approval. Pass your
        own list to configure a module (the LLM adapter belongs to{' '}
        <code>agent({'{ llm }'})</code>), add a domain module, or skip a built-in.
      </p>
      <p>
        <code>start</code> does not care which module owns the definition. An agent
        and a workflow are two kinds of thread; a module you write adds a third,
        and <code>looms.start(myThing, input)</code> works the same way.
      </p>

      <h2>Talk to a running run</h2>
      <p>
        Every input to a run is an event. Modules export small builders so you
        never hand-write payloads:
      </p>
      <pre>
        <code>{`import { userMessage } from '@looms/agent'
import { decision } from '@looms/approval'

await looms.signal(runId, [userMessage('Also greet Maya')])
await looms.signal(runId, [decision(approvalId, 'approve')])`}</code>
      </pre>
      <p>
        Your module can do the same: export a function that returns an{' '}
        <code>EventInput</code>, and callers use it with <code>signal</code> or{' '}
        <code>store.commit</code>.
      </p>

      <h2>Add your own module</h2>
      <p>
        A module declares namespaced events, effects the host should run, and
        optional projections for the UI. Handlers should be safe to retry — use{' '}
        <code>ctx.effectId</code> as an idempotency key.
      </p>
      <pre>
        <code>{`import {
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
}`}</code>
      </pre>
      <p>
        Prefer a Zod (or other Standard Schema) object for each event so the
        payload is validated. When you only need a type,{' '}
        <code>payload{'<{ chargeId: string }>()'}</code> from{' '}
        <code>@looms/core</code> declares it without a runtime schema.
      </p>
      <p>
        Workflows invoke <code>payments.charge</code> and wait on{' '}
        <code>payments.charge.authorized</code>. Agents can expose the same
        charge as a tool. See <Link to="/docs/examples">Examples</Link> for
        definitions and a React ledger.
      </p>
    </>
  )
}
