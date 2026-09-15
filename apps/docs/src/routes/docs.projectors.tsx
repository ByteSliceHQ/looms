import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'
import { ConceptFigure } from '../illustrations/illustration'

export const Route = createFileRoute('/docs/projectors')({
  component: Projectors,
})

function Projectors() {
  return (
    <>
      <h1>Projections &amp; Projectors</h1>
      <p>
        Durable execution is only half the problem. The other half is keeping product surfaces —
        chat, approval queues, ledgers, admin indexes — honest about what the run actually did. In
        Looms, the append-only event log is the only source of truth. State is never mutated in
        place; it is <strong>projected</strong>.
      </p>
      <p>
        That is the bridge between execution and UI: the same events that wake a parked workflow
        also fold into React via <code>@looms/react</code>, and into SQLite or Postgres via
        projectors. No per-feature sync protocol. No second source of truth that drifts.
      </p>

      <ConceptFigure name="projections" />

      <FlowChain steps={['Run stream (truth)', 'Pure fold', 'UI projections', 'DB projectors']} />

      <h2>Two Different Reducer Contracts</h2>
      <p>Looms cleanly separates behavioral execution from observational views:</p>

      <div className="my-8 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-14">
        <div className="[&_h3]:text-foreground [&_p]:text-muted [&_ul]:text-body m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-3 [&_p]:text-[0.9rem] [&_p]:leading-snug [&_ul]:mb-0 [&_ul]:pl-[1.1rem] [&_ul]:text-[0.88rem] [&_ul]:leading-relaxed">
          <span className="text-muted mb-1.5 block text-[0.72rem] font-semibold tracking-widest uppercase">
            Behavioral Reducer
          </span>
          <h3>Changes Runtime Behavior</h3>
          <p>
            <code>(State, Event) &rarr; &#123; state, effects &#125;</code>
          </p>
          <p>
            Owned by Thread kinds (agents, workflows). May request Effects to interact with the
            outside world or spawn children.
          </p>
        </div>

        <div className="[&_h3]:text-foreground [&_p]:text-muted [&_ul]:text-body m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-3 [&_p]:text-[0.9rem] [&_p]:leading-snug [&_ul]:mb-0 [&_ul]:pl-[1.1rem] [&_ul]:text-[0.88rem] [&_ul]:leading-relaxed">
          <span className="text-muted mb-1.5 block text-[0.72rem] font-semibold tracking-widest uppercase">
            Projection Reducer
          </span>
          <h3>Derives an Observational View</h3>
          <p>
            <code>(State, Event) &rarr; State</code>
          </p>
          <p>
            Pure observation. Folds events into a read model (chat history, financial ledger,
            approval queue). Never causes side-effects.
          </p>
        </div>
      </div>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Projections are Portable; React is an Adapter:</strong> A projection definition is
        pure TypeScript. The same projection can be folded in-memory on the host, rendered
        reactively in the browser via <code>@looms/react</code>, or materialized into SQLite,
        Postgres, or ClickHouse for analytics.
      </div>

      <h2>Building Custom UIs Using Projections</h2>
      <p>
        In traditional full-stack apps, building real-time dashboards or agent interfaces requires
        writing ad-hoc REST endpoints, custom WebSocket schemas, and complex cache invalidation
        logic—leading to inevitable state drift.
      </p>
      <p>
        With Looms projections, the UI subscribes directly to the Run event stream. When events
        land, client-side projections re-fold instantly. There are no bespoke sync APIs to maintain.
      </p>

      <h3>Step 1: Define your domain projection</h3>
      <p>
        Define a pure read model using <code>ordersModule.projection</code> from your module&apos;s
        scope (or standalone <code>defineProjection</code> from <code>@looms/core</code>). With{' '}
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

      <h3>Step 2: Provide the host connection</h3>
      <p>
        Wrap your React tree or page with <code>LoomsProvider</code> from <code>@looms/react</code>.
        Pass the Looms host URL; the client opens <code>/api/events</code> on that host:
      </p>
      <CodeBlock lang="tsx">{`import { LoomsProvider } from '@looms/react'
import { OrderDashboard } from './order-dashboard'

export function App({ runId }: { runId: string }) {
  return (
    <LoomsProvider endpoint="http://localhost:8787">
      <OrderDashboard runId={runId} />
    </LoomsProvider>
  )
}`}</CodeBlock>

      <h3>
        Step 3: Subscribe reactively with <code>useProjection</code>
      </h3>
      <p>
        In your component, call <code>useRunStore(runId)</code> to connect to the run&apos;s event
        stream, then pass it to <code>useProjection</code>:
      </p>
      <CodeBlock lang="tsx">{`import { useRunStore, useProjection } from '@looms/react'
import { orderTracker } from './projections'

export function OrderDashboard({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const order = useProjection(store, orderTracker)

  return (
    <div className="order-card">
      <h2>Order {order.orderId ?? 'Initiating...'}</h2>
      <div className="badge">{order.status}</div>
      <p>Total: \${order.total}</p>

      <h3>Timeline</h3>
      <ul>
        {order.history.map((h, i) => (
          <li key={i}>{h.step} &mdash; {new Date(h.timestamp).toLocaleTimeString()}</li>
        ))}
      </ul>
    </div>
  )
}`}</CodeBlock>
      <p>
        Under the hood, <code>useProjection</code> leverages React 19&apos;s{' '}
        <code>useSyncExternalStore</code> with an incremental projection cache. When new events
        append to the run log on the server, the SSE connection receives them and folds only the
        newly appended events into the cached state, coalescing updates at animation frame rates so
        streaming hundreds of events never freezes the UI.
      </p>

      <h3>Step 4: Dispatch user interactions via signals</h3>
      <p>
        User actions do not mutate state directly; they post events to the log using{' '}
        <code>store.commit</code> or <code>client.signal</code>:
      </p>
      <CodeBlock lang="tsx">{`import { decision } from '@looms/approval'
import { userMessage } from '@looms/agent'

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

      <h3>Step 5: Time-travel debugging in the client</h3>
      <p>
        Because projections are pure folds over the event array, rendering historical UI states is
        effortless. You can fold over any prefix of the log:
      </p>
      <CodeBlock lang="tsx">{`import { useState } from 'react'
import { foldProjection } from '@looms/core'
import { useRunStore } from '@looms/react'
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

      <h2>Server-Side Projectors (Cross-Run Storage)</h2>
      <p>
        While client-side projections fold the log of a <em>single run</em>,{' '}
        <strong>projectors</strong> run on the host to watch the entire event store across{' '}
        <em>all runs</em>. Use them to maintain queryable tables, full-text search, or fan out to
        webhooks and Slack.
      </p>

      <h3>Attach projectors to the host</h3>
      <p>
        Wrap the <em>local</em> execution store with <code>withProjectors</code> from{' '}
        <code>@looms/projectors</code>. Events are delivered in log order after each commit.
        Projection failures are isolated — the cell-local log stays authoritative.
      </p>
      <CodeBlock lang="ts">{`import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { withProjectors } from '@looms/projectors'
import { sqlite } from '@looms/projectors/sqlite'
import { s2Projector, s2ConfigFromEnv } from '@looms/s2'

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
        (see <Link to="/docs/durability">Durability</Link>). Projectors can populate relational
        databases, emit webhooks, or replicate events to a centralized data lake via{' '}
        <code>s2Projector</code>.
      </p>

      <h3>Built-in index helpers</h3>
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
              <code>@looms/projectors</code>
            </td>
            <td>Unit tests and single-process development</td>
          </tr>
          <tr>
            <td>
              <code>sqlite(opts)</code>
            </td>
            <td>
              <code>@looms/projectors/sqlite</code>
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
              <code>@looms/projectors/postgres</code>
            </td>
            <td>
              Production servers. Pass <code>{'{ url }'}</code> or an existing postgres.js client
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock lang="ts">{`import { sqlite } from '@looms/projectors/sqlite'

const index = sqlite({ path: './looms.db' })

// Query cross-run indexes from your admin routes:
const run = await index.getActor(runId)
const pendingReviews = await index.listReviews(runId)`}</CodeBlock>

      <h3>Custom webhook and fan-out projectors</h3>
      <p>
        Any object implementing <code>project(events)</code> satisfies the <code>Projector</code>{' '}
        interface:
      </p>
      <CodeBlock lang="ts">{`import type { Projector } from '@looms/projectors'

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
        <Link to="/docs/durability">Durability</Link>, or browse packages in{' '}
        <Link to="/docs/modules">Modules</Link>.
      </p>
    </>
  )
}
