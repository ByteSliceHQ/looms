import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'
import { ConceptFigure } from '../illustrations/illustration'

export const Route = createFileRoute('/docs/hosting-and-storage')({
  component: HostingAndStorage,
})

function HostingAndStorage() {
  return (
    <>
      <h1>Hosting &amp; storage</h1>
      <p>
        Production runs execute in a <strong>single-writer actor cell</strong> per{' '}
        <code>runId</code>: local SQLite for the log, alarms for durable waits, snapshots to bound
        memory. Waits, wake, and replay are covered in{' '}
        <Link to="/docs/concepts/waits-and-replay">Waits &amp; replay</Link>; this page is how you
        host them.
      </p>

      <ConceptFigure name="log" />

      <FlowChain
        steps={[
          'Incoming Request',
          'Route by runId',
          'Actor Cell',
          'Local SQLite Log',
          'Wake & Reduce',
        ]}
      />

      <p>
        Because only one writer ever processes a run, Looms avoids distributed locking, heartbeats,
        and consensus leases inside the execution loop. If a worker crashes or deploys, the next
        request routes to a fresh cell, recovers state by loading <code>snapshot + delta</code>, and
        continues from that recovered state.
      </p>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Recommended for production:</strong> Cloudflare Durable Objects via{' '}
        <code>@looms/cloudflare</code>. Each run lives in a dedicated Durable Object with private
        embedded SQLite (<code>ctx.storage.sql</code>) and native timer alarms (
        <code>ctx.storage.setAlarm</code>).
      </div>

      <h2>Deployment Targets</h2>
      <table>
        <thead>
          <tr>
            <th>Target</th>
            <th>Package</th>
            <th>Durability Model</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Cloudflare Durable Objects</strong>
            </td>
            <td>
              <code>@looms/cloudflare</code>
            </td>
            <td>
              Per-run SQLite via <code>ctx.storage.sql</code> + durable alarms
            </td>
            <td>Production serverless and edge deployments (recommended)</td>
          </tr>
          <tr>
            <td>
              <strong>celld</strong>
            </td>
            <td>
              Same DO bundle + <code>denoland/celld</code>
            </td>
            <td>Per-run SQLite with S3-compatible bucket replication</td>
            <td>Self-hosted virtual actors without Cloudflare infrastructure</td>
          </tr>
          <tr>
            <td>
              <strong>Local Bun Actors</strong>
            </td>
            <td>
              <code>@looms/actor</code> + <code>@looms/core/bun-sqlite</code>
            </td>
            <td>
              Per-run SQLite files (e.g. <code>.looms/runs/&lt;id&gt;.sqlite</code>)
            </td>
            <td>Local development and standalone server apps</td>
          </tr>
          <tr>
            <td>
              <strong>In-Memory Embed</strong>
            </td>
            <td>
              <code>@looms/runtime</code> (<code>createLooms</code>)
            </td>
            <td>Shared in-memory event store</td>
            <td>Unit tests, CLI scripts, and ephemeral simulations</td>
          </tr>
        </tbody>
      </table>

      <h2>Cloudflare Durable Objects (Recommended)</h2>
      <p>
        Cloudflare Durable Objects fit Looms runs well: strongly consistent, globally routable by
        name, migrate during infrastructure maintenance, and scale to zero idle cost when a run
        parks.
      </p>
      <p>
        To run on Cloudflare, subclass <code>LoomsDurableObject</code> from{' '}
        <code>@looms/cloudflare</code>, configure your modules and definitions, and route incoming
        requests using <code>routeToDurableObject</code>:
      </p>
      <CodeBlock lang="ts">{`import {
  LoomsDurableObject,
  routeToDurableObject,
  type LoomsDurableObjectConfig,
} from '@looms/cloudflare'
import { definitions } from './definitions'
import { modules } from './modules'

export interface Env {
  readonly LOOMS_RUN: DurableObjectNamespace<LoomsRun>
}

export class LoomsRun extends LoomsDurableObject<Env> {
  override configure(env: Env): LoomsDurableObjectConfig {
    return {
      modules: modules(env),
      definitions,
      // Optional: attach projectors for cross-run databases or lakes
      // projectors: [s2Projector(s2ConfigFromEnv(env))],
    }
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const res = await routeToDurableObject(env.LOOMS_RUN, req)
    return res ?? new Response('Not Found', { status: 404 })
  },
}`}</CodeBlock>

      <h3>How Durable Objects execute runs</h3>
      <ul>
        <li>
          <strong>Isolated SQLite databases:</strong> Each run gets a dedicated SQLite database
          managed by <code>ctx.storage.sql</code>. Appends execute in single-digit milliseconds with
          strict serializability.
        </li>
        <li>
          <strong>Native alarm scheduling:</strong> When an agent or workflow waits on a timer (
          <code>ctx.effects.wait({'{ timer }'})</code>), the cell schedules a Durable Object alarm
          via <code>ctx.storage.setAlarm</code>. The run unloads from memory until the alarm fires.
        </li>
        <li>
          <strong>Live event streaming:</strong> Real-time UI subscriptions (SSE via{' '}
          <code>/api/events</code>) connect directly to the Durable Object owning that run. Events
          push over SSE; there is no poll loop.
        </li>
      </ul>

      <p>
        Try the full Cloudflare setup in <code>apps/demo-worker</code>:
      </p>
      <CodeBlock lang="bash">{`bun run dev:cloudflare
# Starts the TanStack demo UI on :8787 and proxies runs to the DO worker on :8788`}</CodeBlock>

      <h2>Self-Hosting with celld</h2>
      <p>
        If your organization runs on private cloud infrastructure (AWS, GCP, bare metal) but wants
        the same virtual-actor ergonomics, you can run the exact same worker bundle on{' '}
        <a href="https://github.com/denoland/celld" target="_blank" rel="noreferrer">
          celld
        </a>
        .
      </p>
      <p>
        <code>celld</code> is a self-hosted virtual actor server that implements the Workers and
        Durable Objects runtime while replicating SQLite state to S3-compatible object storage.
        Because <code>LoomsDurableObject</code> targets the standard Durable Objects API, zero code
        changes are required:
      </p>
      <CodeBlock lang="bash">{`# Develop locally with celld:
celld dev .

# Deploy to your Kubernetes cluster or VMs with S3 backup:
celld deploy . --bucket $CELLD_BUCKET`}</CodeBlock>

      <h2>Local Development with Bun Actor Hosts</h2>
      <p>
        When developing locally or running inside a traditional Node/Bun backend, use{' '}
        <code>createLocalActorHost</code> from <code>@looms/actor</code>. It provides the same
        per-run isolation by creating a dedicated SQLite file for every <code>runId</code>:
      </p>
      <CodeBlock lang="ts">{`import { createLocalActorHost } from '@looms/actor'
import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { join } from 'node:path'
import { definitions } from './definitions'
import { modules } from './modules'

const runsDir = join(process.cwd(), '.looms', 'runs')

export const host = createLocalActorHost({
  createStore: async (runId) => {
    return bunSqliteEventStore({
      path: join(runsDir, \`\${runId}.sqlite\`),
    })
  },
  modules,
  definitions,
})

export default {
  fetch: (req: Request) => host.fetch(req),
}`}</CodeBlock>
      <p>
        The local host automatically scans stored runs for pending timers on startup, so interrupted
        waits resume cleanly across process restarts.
      </p>

      <h2>Custom Runtimes: Bring Your Own Host</h2>
      <p>
        You can embed Looms into existing infrastructure (Kubernetes StatefulSets, Nomad, hash-ring
        clusters, or custom server frameworks). Any host architecture works as long as it upholds
        one invariant:{' '}
        <strong>
          exactly one process drives a given <code>runId</code> at a time
        </strong>
        .
      </p>
      <p>
        The primitive is <code>createActorCell</code> from <code>@looms/actor</code>:
      </p>
      <CodeBlock lang="ts">{`import { createActorCell } from '@looms/actor'
import { sqliteEventStore } from '@looms/core'

// 1. Resolve or allocate an EventStore for this run
const store = sqliteEventStore({ exec: myDatabaseConnection })

// 2. Instantiate the isolated cell
const cell = createActorCell({
  runId: 'run_94819',
  store,
  modules: [agent({ llm }), workflow({ definitions: [checkoutWorkflow] }), approval()],
})

// 3. Dispatch HTTP or internal requests directly to the cell
const response = await cell.fetch(incomingRequest)`}</CodeBlock>
      <p>
        Both <code>LoomsDurableObject</code> and <code>createLocalActorHost</code> are lightweight
        routers built on top of <code>createActorCell</code>.
      </p>

      <h2>Cold Starts &amp; Snapshots</h2>
      <p>
        Because a run may accumulate thousands of events across prolonged conversations or complex
        DAGs, Looms uses an efficient <strong>snapshot + delta</strong> recovery strategy:
      </p>
      <CodeBlock lang="text">{`Recovery:
  Latest Snapshot (seq: 400)
             +
  Delta Events [401, 402, 403]
             ↓
  Reconstructed State at seq: 403 in <1ms`}</CodeBlock>
      <ul>
        <li>
          <strong>Automatic snapshot on park:</strong> Whenever a run finishes a wake cycle and
          parks (waiting on a human decision, timer, or external webhook), Looms writes a snapshot
          at the log tail. The next activation only folds events that landed since that snapshot.
        </li>
        <li>
          <strong>Mid-wake checkpoints:</strong> For long-running turns, <code>snapshotEvery</code>{' '}
          (default 200 events) takes snapshots mid-wake to bound recovery time in case of worker
          termination.
        </li>
        <li>
          <strong>Log retention:</strong> By configuring <code>trimAfterSnapshot</code>, older
          events and obsolete snapshots can be automatically pruned to conserve local storage.
        </li>
      </ul>

      <h2>Replicating Events to Data Lakes (S2)</h2>
      <p>
        While actor cells own local event storage for fast execution, you often want a centralized
        stream of all events across all runs for auditing, business intelligence, or compliance.
      </p>
      <p>
        Use <code>s2Projector</code> from <code>@looms/s2</code> to replicate committed events to a
        global S2 stream lake without coupling your runtime to external network latencies:
      </p>
      <CodeBlock lang="ts">{`import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { withProjectors } from '@looms/projectors'
import { s2Projector, s2ConfigFromEnv } from '@looms/s2'

// Execution appends to local SQLite; committed events stream asynchronously to S2
const store = withProjectors(
  bunSqliteEventStore({ path: './runs/order_123.sqlite' }),
  [s2Projector(s2ConfigFromEnv(process.env))],
)`}</CodeBlock>
      <p>
        Projectors run after events commit locally. If downstream lake ingestion hits a temporary
        network hiccup, execution continues and local durability is unchanged.
      </p>

      <h2>Next steps</h2>
      <p>
        Author capabilities in <Link to="/docs/modules">Modules</Link>, fold events into UI in{' '}
        <Link to="/docs/projectors">Projections</Link>, or spin up with the{' '}
        <Link to="/docs/quickstart">Quickstart</Link>.
      </p>
    </>
  )
}
