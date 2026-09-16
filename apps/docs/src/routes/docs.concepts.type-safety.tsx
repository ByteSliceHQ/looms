import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/concepts/type-safety')({
  head: () => pageHead('/docs/concepts/type-safety'),
  component: TypeSafety,
})

function TypeSafety() {
  return (
    <>
      <h1>Type safety</h1>
      <p>
        Types start in the event catalog and flow through module reducers, effects, projections, and
        React hooks via <code>EventsOf</code> and <code>LoomsRegister</code>.
      </p>

      <h2 id="the-chain">
        The chain
        <a className="heading-anchor" href="#the-chain" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ol>
        <li>
          A Zod-backed (or Effect / Standard Schema) event catalog fixes event names and payloads.
        </li>
        <li>
          <code>defineModule</code> scope narrows <code>event</code> in <code>thread.step</code> /{' '}
          <code>projection.reduce</code> and checks effect outputs.
        </li>
        <li>
          Typed <code>invoke(effectDef, input)</code> checks effect input.
        </li>
        <li>
          <code>ProjectionDefinition&lt;S&gt;</code> carries projection state into{' '}
          <code>looms.project</code> and <code>useProjection</code>.
        </li>
        <li>
          <code>EventsOf&lt;typeof modules&gt;</code> plus <code>LoomsRegister</code> gives React
          hooks the application event union.
        </li>
      </ol>

      <h2 id="1-catalog">
        1. Catalog
        <a className="heading-anchor" href="#1-catalog" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Catalog keys become namespaced event types. Payload schemas fix what builders and reducers
        accept:
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { defineEventCatalog } from '@swirls/looms/core'

const ChargeRequested = z.object({
  chargeId: z.string(),
  amount: z.number(),
  currency: z.string(),
})

export const paymentsCatalog = defineEventCatalog('payments', {
  'charge.requested': ChargeRequested,
  'charge.authorized': ChargeRequested,
  'charge.declined': ChargeRequested.extend({ reason: z.string() }),
})

// Event type: 'payments.charge.authorized'
paymentsCatalog.input('charge.authorized', {
  chargeId: 'ch_123',
  amount: 40,
  currency: 'USD',
})`}</CodeBlock>

      <h2 id="2-scoped-reducers-and-effects">
        2. Scoped reducers and effects
        <a
          className="heading-anchor"
          href="#2-scoped-reducers-and-effects"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Inside <code>defineModule</code>, <code>event.type</code> is a discriminated union over the
        module catalog (plus protocol events and any <code>observes</code> catalogs). Effect
        handlers may only return events from that universe:
      </p>
      <CodeBlock lang="ts">{`export const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: paymentsCatalog,
  },
  (m) => ({
    effects: {
      charge: m.effect({
        type: 'payments.charge',
        input: z.object({ amount: z.number(), currency: z.string().optional() }),
        execute: (input, ctx) => [
          {
            type: 'payments.charge.requested',
            payload: {
              chargeId: ctx.effectId,
              amount: input.amount,
              currency: input.currency ?? 'USD',
            },
          },
        ],
      }),
    },
    projections: {
      ledger: m.projection({
        name: 'ledger',
        shape: z.object({
          entries: z.array(
            z.object({
              chargeId: z.string(),
              amount: z.number(),
              currency: z.string(),
              status: z.enum(['requested', 'authorized', 'declined']),
            }),
          ),
        }),
        initialState: { entries: [] },
        reduce(state, event) {
          switch (event.type) {
            case 'payments.charge.authorized':
              return {
                entries: [
                  ...state.entries,
                  {
                    chargeId: event.payload.chargeId,
                    amount: event.payload.amount,
                    currency: event.payload.currency,
                    status: 'authorized' as const,
                  },
                ],
              }
            default:
              return state
          }
        },
      }),
    },
  }),
)

export const charge = payments.effects.charge
export const ledger = payments.projections.ledger`}</CodeBlock>

      <h2 id="3-typed-invoke">
        3. Typed invoke
        <a className="heading-anchor" href="#3-typed-invoke" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>Pass the effect definition when you want input checking:</p>
      <CodeBlock lang="ts">{`import { invoke } from '@swirls/looms/core'

invoke(charge, { amount: 40, currency: 'USD' })`}</CodeBlock>

      <h2 id="4-projection-state">
        4. Projection state
        <a className="heading-anchor" href="#4-projection-state" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The projection&apos;s <code>shape</code> (or <code>initialState</code>) is the state type.
        Server and client share the same definition:
      </p>
      <CodeBlock lang="ts">{`const book = await looms.project(runId, ledger)
// book.entries: { chargeId, amount, currency, status }[]`}</CodeBlock>

      <h2 id="5-react-register">
        5. React register
        <a className="heading-anchor" href="#5-react-register" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Augment <code>LoomsRegister</code> with your composed modules so hooks see the same event
        union as the host:
      </p>
      <CodeBlock lang="ts">{`import type { EventsOf } from '@swirls/looms/core'
import type {} from '@swirls/looms/react'
import { approval } from '@swirls/looms/approval'
import { workflow } from '@swirls/looms/workflow'

const modules = [workflow({ definitions: [checkout] }), approval(), payments] as const

export type AppEvents = EventsOf<typeof modules>

declare module '@swirls/looms/react' {
  interface LoomsRegister {
    events: AppEvents
  }
}`}</CodeBlock>
      <CodeBlock lang="tsx">{`import { useProjection, useRunStore } from '@swirls/looms/react'

function Ledger({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const book = useProjection(store, ledger)
  return <p>{book.entries.length} charges</p>
}`}</CodeBlock>

      <h2 id="typescript-catches-this">
        TypeScript catches this
        <a
          className="heading-anchor"
          href="#typescript-catches-this"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <CodeBlock lang="ts">{`// @ts-expect-error — unknown catalog key
paymentsCatalog.input('charge.authorised', { chargeId: 'x', amount: 1, currency: 'USD' })

// @ts-expect-error — wrong payload shape
paymentsCatalog.input('charge.authorized', { chargeId: 'x', amount: '40', currency: 'USD' })

// @ts-expect-error — wrong effect input
invoke(charge, { amount: '40' })`}</CodeBlock>

      <h2 id="boundaries">
        Boundaries
        <a className="heading-anchor" href="#boundaries" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>
          Zod / Effect / Standard Schema catalog entries validate at runtime on signal and effect
          boundaries. <code>payload&lt;T&gt;()</code> is compile-time only.
        </li>
        <li>
          Wire events (SSE / HTTP) decode as generic envelopes. <code>LoomsRegister</code> supplies
          the application event union to React; trust still depends on the host.
        </li>
        <li>
          Scoped <code>m.thread</code> / <code>m.projection</code> / <code>m.effect</code> give
          stronger event narrowing than standalone <code>defineThread</code> /{' '}
          <code>defineProjection</code> / <code>defineEffect</code>.
        </li>
        <li>
          <code>wait(&#123; on: &#123; type &#125; &#125;)</code> matches on strings; it is not
          catalog-parameterized.
        </li>
      </ul>

      <p>
        Authoring lives in <Link to="/docs/modules">Modules</Link>. Projection folds live in{' '}
        <Link to="/docs/projectors">Projections</Link>. Catalogs and signals live in{' '}
        <Link to="/docs/concepts/events-and-effects">Events &amp; effects</Link>.
      </p>
    </>
  )
}
