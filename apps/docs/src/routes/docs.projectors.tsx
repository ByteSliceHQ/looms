import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'
import { ConceptFigure } from '../illustrations/illustration'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/projectors')({
  head: () => pageHead('/docs/projectors'),
  component: Projectors,
})

function Projectors() {
  return (
    <>
      <h1>Projections &amp; projectors</h1>
      <p>
        The append-only event log is the only source of truth. Product surfaces (chat, approval
        queues, ledgers, admin indexes) are <strong>projected</strong> from that log via{' '}
        <code>@swirls/looms/react</code> or cross-run projectors. Scoped projections share types
        with the host; see <Link to="/docs/concepts/type-safety">Type safety</Link>.
      </p>

      <ConceptFigure name="projections" />

      <FlowChain steps={['Run stream (truth)', 'Pure fold', 'UI projections', 'DB projectors']} />

      <h2 id="behavioral-vs-projection-reducers">
        Behavioral vs projection reducers
        <a
          className="heading-anchor"
          href="#behavioral-vs-projection-reducers"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Thread kinds use <strong>behavioral</strong> reducers (
        <code>(state, event) &rarr; &#123; state, effects &#125;</code>). Projections use{' '}
        <strong>projection</strong> reducers (<code>(state, event) &rarr; state</code>): pure
        observation, no side effects. Full event/effect boundary:{' '}
        <Link to="/docs/concepts/events-and-effects">Events &amp; effects</Link>.
      </p>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Projections are portable; React is an adapter.</strong> The same definition folds
        in-memory on the host, reactively in the browser via <code>@swirls/looms/react</code>, or
        into SQLite, Postgres, or ClickHouse.
      </div>

      <h2 id="building-custom-uis">
        Building custom UIs
        <a className="heading-anchor" href="#building-custom-uis" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The UI subscribes to the run event stream. When events land, client-side projections
        re-fold.
      </p>

      <h3 id="step-1-define-your-domain-projection">
        Step 1: Define your domain projection
        <a
          className="heading-anchor"
          href="#step-1-define-your-domain-projection"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        The snippets in this walkthrough use application-specific order events and an ordersModule
        scope, defined with the module API. They illustrate integration rather than a standalone
        application; the quickstart provides a complete runnable example. Define a pure read model
        using <code>ordersModule.projection</code> from your module&apos;s scope (or standalone{' '}
        <code>defineProjection</code> from <code>@swirls/looms/core</code>). With{' '}
        <code>scope.projection</code>, event types and payloads are automatically narrowed per case
        based on the module&apos;s registered catalogs. Providing a Zod (or Standard Schema){' '}
        <code>shape</code> infers the state type automatically without an explicit generic. Export
        it so both server and client can use it.
      </p>
      <CodeBlock lang="ts">{`import { z } from 'zod'
import { ordersModule } from './scope'

export const OrderSchema = z.object({
  orderId: z.string().nullable(),
  items: z.array(z.string()),
  total: z.number(),
  status: z.enum(['draft', 'awaiting_approval', 'processing', 'completed', 'failed']),
  approvalId: z.string().nullable(),
  paymentId: z.string().nullable(),
  history: z.array(z.object({ step: z.string(), timestamp: z.number() })),
})

export type OrderState = z.infer<typeof OrderSchema>

export const orderTracker = ordersModule.projection({
  name: 'orderTracker',
  shape: OrderSchema,
  initialState: {
    orderId: null,
    items: [],
    total: 0,
    status: 'draft',
    approvalId: null,
    paymentId: null,
    history: [],
  },
  reduce(state, event) {
    // state is inferred from shape; event is narrowed per case by scope
    switch (event.type) {
      case 'orders.created':
        return {
          ...state,
          orderId: event.payload.orderId,
          items: event.payload.items,
          total: event.payload.total,
          status: 'draft',
          history: [...state.history, { step: 'Order Created', timestamp: event.ts }],
        }
      case 'approval.requested':
        return {
          ...state,
          status: 'awaiting_approval',
          approvalId: event.payload.approvalId,
          history: [...state.history, { step: 'Approval Requested', timestamp: event.ts }],
        }
      case 'approval.decided':
        return {
          ...state,
          status: event.payload.outcome === 'approve' ? 'processing' : 'failed',
          history: [...state.history, { step: \`Approval \${event.payload.outcome}d\`, timestamp: event.ts }],
        }
      case 'payments.charge.authorized':
        return {
          ...state,
          status: 'completed',
          paymentId: event.payload.chargeId,
          history: [...state.history, { step: 'Payment Authorized', timestamp: event.ts }],
        }
      default:
        return state
    }
  },
})`}</CodeBlock>

      <h3 id="step-2-provide-the-host-connection">
        Step 2: Provide the host connection
        <a
          className="heading-anchor"
          href="#step-2-provide-the-host-connection"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        Wrap your React tree or page with <code>LoomsProvider</code> from{' '}
        <code>@swirls/looms/react</code>. Pass the Looms host URL; the client opens{' '}
        <code>/api/events</code> on that host:
      </p>
      <CodeBlock lang="tsx">{`import { LoomsProvider } from '@swirls/looms/react'
import { OrderDashboard } from './order-dashboard'

export function App({ runId }: { runId: string }) {
  return (
    <LoomsProvider endpoint="http://localhost:8787">
      <OrderDashboard runId={runId} />
    </LoomsProvider>
  )
}`}</CodeBlock>

      <h3 id="step-3-subscribe-reactively-with-useprojection">
        Step 3: Subscribe reactively with <code>useProjection</code>
        <a
          className="heading-anchor"
          href="#step-3-subscribe-reactively-with-useprojection"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        In your component, call <code>useRunStore(runId)</code> to connect to the run&apos;s event
        stream, then pass it to <code>useProjection</code>:
      </p>
      <CodeBlock lang="tsx">{`import { useRunStore, useProjection } from '@swirls/looms/react'
import { orderTracker } from './projections'

export function OrderDashboard({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const order = useProjection(store, orderTracker)

  return (
    <div className="order-card">
      <h2>Order {order.orderId ?? 'Initiating...'}</h2>
      <div className="badge">{order.status}</div>
      <p>Total: \${order.total}</p>

      <h3 id="timeline">Timeline<a className="heading-anchor" href="#timeline" aria-label="Link to this section">#</a></h3>
      <ul>
        {order.history.map((h, i) => (
          <li key={i}>{h.step} &mdash; {new Date(h.timestamp).toLocaleTimeString()}</li>
        ))}
      </ul>
    </div>
  )
}`}</CodeBlock>
      <p>
        <code>useProjection</code> uses React&apos;s <code>useSyncExternalStore</code> with an
        incremental projection cache. When new events append to the run log on the server, the SSE
        connection receives them and folds only the newly appended events into the cached state,
        coalescing updates at animation frame rates. Rendering cost still depends on the projection
        and the components that subscribe to it.
      </p>

      <h3 id="step-4-dispatch-user-interactions-via-signals">
        Step 4: Dispatch user interactions via signals
        <a
          className="heading-anchor"
          href="#step-4-dispatch-user-interactions-via-signals"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        User actions do not mutate state directly; they post events to the log using{' '}
        <code>store.commit</code> or <code>client.signal</code>:
      </p>
      <p>
        This excerpt is for a trusted internal client behind a gateway that authorizes the run and
        validates allowed signals. For a public browser UI, send a decision intent to an application
        endpoint that authenticates the reviewer and constructs the event. See{' '}
        <Link to="/docs/security">authentication and tenancy</Link>. Add pending and error states
        before using these controls in a product.
      </p>
      <CodeBlock lang="tsx">{`import { decision } from '@swirls/looms/approval'
import { useRunStore, useProjection } from '@swirls/looms/react'
import { orderTracker } from './projections'

export function OrderControls({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const order = useProjection(store, orderTracker)

  const handleApprove = () => {
    if (order.approvalId) {
      store.commit(decision(order.approvalId, 'approve'))
    }
  }

  const handleReject = () => {
    if (order.approvalId) {
      store.commit(decision(order.approvalId, 'reject'))
    }
  }

  if (order.status !== 'awaiting_approval') return null

  return (
    <div className="actions">
      <p>Human approval required for orders over $100</p>
      <button onClick={handleApprove}>Approve Order</button>
      <button onClick={handleReject}>Reject Order</button>
    </div>
  )
}`}</CodeBlock>
      <p>
        When <code>store.commit</code> runs, the signal lands on the server, wakes the parked
        thread, and streams back to all subscribers, updating all projections automatically.
      </p>

      <h3 id="step-5-time-travel-debugging-in-the-client">
        Step 5: Time-travel debugging in the client
        <a
          className="heading-anchor"
          href="#step-5-time-travel-debugging-in-the-client"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        Because projections are pure folds over the event array, you can fold any prefix of the log
        to render a historical UI state:
      </p>
      <CodeBlock lang="tsx">{`import { useState } from 'react'
import { foldProjection } from '@swirls/looms/core'
import { useRunStore } from '@swirls/looms/react'
import { orderTracker } from './projections'

export function TimeTravelSlider({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const events = store.events()
  const [step, setStep] = useState(events.length)

  // Reconstruct state at event #step with zero backend round-trips:
  const pastState = foldProjection(orderTracker, events.slice(0, step))

  return (
    <div>
      <input
        type="range"
        min={0}
        max={events.length}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
      />
      <span>Viewing step {step} of {events.length}</span>
      <pre>{JSON.stringify(pastState, null, 2)}</pre>
    </div>
  )
}`}</CodeBlock>

      <h2 id="server-side-projectors-cross-run-storage">
        Server-Side Projectors (Cross-Run Storage)
        <a
          className="heading-anchor"
          href="#server-side-projectors-cross-run-storage"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        While client-side projections fold the log of a <em>single run</em>,{' '}
        <strong>projectors</strong> run on the host to watch the entire event store across{' '}
        <em>all runs</em>. Use them to maintain queryable tables, full-text search, or fan out to
        webhooks and Slack.
      </p>

      <h3 id="attach-projectors-to-the-host">
        Attach projectors to the host
        <a
          className="heading-anchor"
          href="#attach-projectors-to-the-host"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        Wrap the <em>local</em> execution store with <code>withProjectors</code> from{' '}
        <code>@swirls/looms/projectors</code>. Events are delivered in log order after each commit.
        Projection failures are isolated — the cell-local log stays authoritative.
      </p>
      <CodeBlock lang="ts">{`import { bunSqliteEventStore } from '@swirls/looms/core/bun-sqlite'
import { withProjectors } from '@swirls/looms/projectors'
import { sqlite } from '@swirls/looms/projectors/sqlite'
import { s2Projector, s2ConfigFromEnv } from '@swirls/looms/s2'

// Local SQLite is the execution store. Index + S2 lake are projectors.
const store = withProjectors(bunSqliteEventStore({ path: './run.sqlite' }), [
  sqlite({ path: './looms-index.db' }),
  s2Projector(s2ConfigFromEnv(process.env)),
], {
  onError: (error, projector) => {
    console.warn(projector.name, error.message)
  },
})`}</CodeBlock>
      <p>
        On Cloudflare Durable Objects, supply projectors via <code>configure().projectors</code>{' '}
        (see <Link to="/docs/hosting-and-storage">Hosting &amp; storage</Link>). Projectors can
        populate relational databases, emit webhooks, or replicate events to a centralized data lake
        via <code>s2Projector</code>.
      </p>

      <h3 id="built-in-index-helpers">
        Built-in index helpers
        <a
          className="heading-anchor"
          href="#built-in-index-helpers"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        Looms includes built-in projectors for Memory, SQLite, and Postgres to keep a searchable run
        index and an approval index up to date:
      </p>
      <table>
        <thead>
          <tr>
            <th>Helper</th>
            <th>Import</th>
            <th>When to use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>memory()</code>
            </td>
            <td>
              <code>@swirls/looms/projectors</code>
            </td>
            <td>Unit tests and single-process development</td>
          </tr>
          <tr>
            <td>
              <code>sqlite(opts)</code>
            </td>
            <td>
              <code>@swirls/looms/projectors/sqlite</code>
            </td>
            <td>
              Local file path or existing <code>db</code>. Defaults to <code>:memory:</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>postgres(opts)</code>
            </td>
            <td>
              <code>@swirls/looms/projectors/postgres</code>
            </td>
            <td>
              Production servers. Pass <code>{'{ url }'}</code> or an existing postgres.js client
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock lang="ts">{`import { sqlite } from '@swirls/looms/projectors/sqlite'

const index = sqlite({ path: './looms.db' })

// Query cross-run indexes from your admin routes:
const run = await index.getActor(runId)
const pendingReviews = await index.listReviews(runId)`}</CodeBlock>

      <h3 id="custom-webhook-and-fan-out-projectors">
        Custom webhook and fan-out projectors
        <a
          className="heading-anchor"
          href="#custom-webhook-and-fan-out-projectors"
          aria-label="Link to this section"
        >
          #
        </a>
      </h3>
      <p>
        Any object implementing <code>project(events)</code> satisfies the <code>Projector</code>{' '}
        interface:
      </p>
      <CodeBlock lang="ts">{`import type { Projector } from '@swirls/looms/projectors'

export function approvalsWebhook(url: string): Projector {
  return {
    name: 'approvals-webhook',
    project: async (events) => {
      for (const event of events) {
        if (event.type !== 'approval.requested') continue
        await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            runId: event.runId,
            approvalId: event.payload.approvalId,
            title: event.payload.title,
          }),
        })
      }
    },
  }
}`}</CodeBlock>
      <p>
        Next: see complete working examples of custom projections in{' '}
        <Link to="/docs/examples">Examples</Link>, host runs on Durable Objects in{' '}
        <Link to="/docs/hosting-and-storage">Hosting &amp; storage</Link>, or browse packages in{' '}
        <Link to="/docs/modules">Modules</Link>.
      </p>
    </>
  )
}
