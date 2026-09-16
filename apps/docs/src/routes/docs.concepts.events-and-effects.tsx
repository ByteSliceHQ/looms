import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'
import { ConceptFigure } from '../illustrations/illustration'

export const Route = createFileRoute('/docs/concepts/events-and-effects')({
  component: EventsAndEffects,
})

function EventsAndEffects() {
  return (
    <>
      <h1>Events &amp; effects</h1>
      <p>
        Looms separates what <em>has occurred</em> from what the runtime <em>should cause</em>.
        Replay and crash recovery depend on that split.
      </p>

      <ConceptFigure name="effects" />

      <div className="my-8 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-14">
        <div className="[&_h3]:text-foreground [&_p]:text-muted [&_ul]:text-body m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-3 [&_p]:text-[0.9rem] [&_p]:leading-snug [&_ul]:mb-0 [&_ul]:pl-[1.1rem] [&_ul]:text-[0.88rem] [&_ul]:leading-relaxed">
          <span className="text-muted mb-1.5 block text-[0.72rem] font-semibold tracking-widest uppercase">
            Event: immutable fact
          </span>
          <h3>Something already happened</h3>
          <p>Past-tense records written to the log.</p>
          <ul>
            <li>
              <code>agent.message</code>
            </li>
            <li>
              <code>workflow.node.finished</code>
            </li>
            <li>
              <code>approval.decided</code>
            </li>
            <li>
              <code>payments.charge.authorized</code>
            </li>
          </ul>
        </div>

        <div className="[&_h3]:text-foreground [&_p]:text-muted [&_ul]:text-body m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-3 [&_p]:text-[0.9rem] [&_p]:leading-snug [&_ul]:mb-0 [&_ul]:pl-[1.1rem] [&_ul]:text-[0.88rem] [&_ul]:leading-relaxed">
          <span className="text-muted mb-1.5 block text-[0.72rem] font-semibold tracking-widest uppercase">
            Effect: requested consequence
          </span>
          <h3>Something the runtime should cause</h3>
          <p>Imperative intents returned by pure reducers.</p>
          <ul>
            <li>
              <code>invoke(charge, &#123; amount: 40 &#125;)</code>
            </li>
            <li>
              <code>
                spawn(&#123; kind: &apos;agent&apos;, definitionName: &apos;researcher&apos;, input
                &#125;)
              </code>
            </li>
            <li>
              <code>emit(&#123; type: &apos;payments.charge.requested&apos;, payload &#125;)</code>
            </li>
            <li>
              <code>
                wait(&#123; waitId, on: &#123; type: &apos;approval.decided&apos; &#125; &#125;)
              </code>
            </li>
          </ul>
        </div>
      </div>

      <FlowChain steps={['Event', 'Reducer', 'State + Effects']} />
      <FlowChain steps={['Effect', 'World (IO)', 'Event']} />

      <p>
        During replay or debugging, reducers re-run over historical events to reconstruct state, but
        the runtime skips effect dispatch. You do not re-charge a customer or re-call an LLM when
        recovering from a crash.
      </p>

      <h2>Event catalogs</h2>
      <p>
        Domain events live in a namespaced catalog. Keys become typed event strings (
        <code>payments.charge.authorized</code>). Builders fix the payload type at the call site:
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { defineEventCatalog } from '@looms/core'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

export const paymentsCatalog = defineEventCatalog('payments', {
  'charge.requested': Charge,
  'charge.authorized': Charge,
})

// Typed signal / commit input:
paymentsCatalog.input('charge.authorized', {
  chargeId: 'ch_123',
  amount: 40,
})`}</CodeBlock>
      <p>
        How those types reach projections and React:{' '}
        <Link to="/docs/concepts/type-safety">Type safety</Link>.
      </p>

      <h2>Signals</h2>
      <p>
        A <strong>signal</strong> is an externally originated event injected into the stream: user
        messages, human approvals, webhooks. Signals steer, wake, pause, or resume parked threads.
        Internally emitted events and external signals both land on the same log:
      </p>
      <CodeBlock lang="ts">{`await looms.signal(runId, [
  paymentsCatalog.input('charge.authorized', {
    chargeId: 'ch_123',
    amount: 40,
  }),
])`}</CodeBlock>

      <h2>Defining an effect</h2>
      <p>
        An effect handler is host-side IO. Reducers request it with <code>invoke</code>; the handler
        returns events that append to the log. Scoped <code>m.effect</code> keeps the type under
        your module namespace and checks returned event types against the catalog:
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { defineModule } from '@looms/core'

const Charge = z.object({
  chargeId: z.string(),
  amount: z.number(),
})

const payments = defineModule(
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
  }),
)

const { charge } = payments.effects`}</CodeBlock>
      <p>
        Retries, Effect Layers, and <code>ctx.emit</code> live in{' '}
        <Link to="/docs/modules">Modules</Link>.
      </p>

      <h2>Reducers</h2>
      <p>
        Thread kinds use a pure <code>step</code> (state + event &rarr; next state) and an optional{' '}
        <code>effects</code> function that returns runtime instructions. Projection reducers map
        state + event to next state only. See{' '}
        <Link to="/docs/projectors">Projections &amp; projectors</Link> for building UIs and
        indexes.
      </p>

      <h2>Effect instruction set</h2>
      <p>High-level module effects lower into a small runtime instruction set:</p>

      <div className="my-7 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-14">
        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Invoke</code>
          <p>
            External IO (LLM, HTTP, charge a card). Author handlers above or in{' '}
            <Link to="/docs/modules">Modules</Link>.
          </p>
        </div>

        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Spawn</code>
          <p>Create and start a child thread in the same run.</p>
        </div>

        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Emit</code>
          <p>Append an event or signal to the run stream.</p>
        </div>

        <div className="[&_code]:text-foreground [&_p]:text-muted m-0 p-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[0.92rem] [&_code]:font-semibold [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <code>Wait</code>
          <p>
            Suspend until a matching event, child completion, or timer. Details in{' '}
            <Link to="/docs/concepts/waits-and-replay">Waits &amp; replay</Link>.
          </p>
        </div>
      </div>

      <CodeBlock lang="ts">{`import { emit, invoke, spawn, wait } from '@looms/core'

// Domain helpers lower into the instruction set:
invoke(charge, { amount: 40 })
spawn({ kind: 'agent', definitionName: 'researcher', input: { question: 'why?' } })
emit({ type: 'approval.requested', payload: { approvalId: 'appr_1', title: 'Refund' } })
wait({
  waitId: 'appr_1',
  on: { type: 'approval.decided', match: { approvalId: 'appr_1' } },
})
wait({ waitId: 'sleep_1', on: { timerAt: Date.now() + 60_000 } })`}</CodeBlock>

      <h2>Lifecycle events</h2>
      <p>The runtime also appends its own lifecycle facts alongside module events:</p>
      <ul>
        <li>
          <code>runtime.run.started</code> / <code>completed</code>
        </li>
        <li>
          <code>runtime.thread.started</code> / <code>completed</code> / <code>failed</code> /{' '}
          <code>cancelled</code>
        </li>
        <li>
          <code>runtime.wait.registered</code> / <code>satisfied</code>
        </li>
        <li>
          <code>runtime.timer.set</code> / <code>fired</code>
        </li>
        <li>
          <code>runtime.signal.received</code>
        </li>
      </ul>
      <p>
        Next: <Link to="/docs/concepts/type-safety">Type safety</Link>,{' '}
        <Link to="/docs/concepts/waits-and-replay">Waits &amp; replay</Link>, or{' '}
        <Link to="/docs/modules">Modules</Link> for full authoring.
      </p>
    </>
  )
}
