import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { FlowChain } from '../components/flow-chain'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <>
      <h1>Introduction</h1>
      <p>
        Looms is an <strong>event-sourced execution runtime</strong> for long-running work inside
        your application: LLM agents, DAG workflows, human approvals, and domain modules you own
        (payments, tickets, search). You compose the capabilities you need, start a{' '}
        <strong>run</strong>, and every worker and client observes the same durable event log.
      </p>

      <FlowChain steps={['Event', 'Pure Reducer', 'State + Effects', 'World', 'Event']} />

      <p>
        Every capability in Looms — conversational agents, DAG workflows, human approval gates,
        reactive chat interfaces, financial ledgers, and database indexes — is built either as a
        composable module or as a pure projection over this stream.
      </p>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Core invariant:</strong> Logical runtime state changes only by processing an event.
        Effects request IO; IO returns as new events. Replay reconstructs state without re-running
        the world.
      </div>

      <h2>Why this model for agents and workflows</h2>
      <p>
        Agentic systems fail in ways CRUD apps rarely do. A turn can crash after an LLM call but
        before a tool result is recorded. A workflow can wait three days for a human. Two
        subscribers can disagree about whether an approval is still pending. Most frameworks paper
        over this with retries, ad-hoc job tables, and UI-specific sync protocols.
      </p>
      <p>Looms starts from a smaller claim:</p>
      <ul>
        <li>
          <strong>A run is a durability boundary</strong> — one append-only log identified by{' '}
          <code>runId</code>. Crash recovery is replaying that log.
        </li>
        <li>
          <strong>A thread is the unit of computation</strong> — agents, workflows, and custom kinds
          share the same parent/child tree inside the run. Nesting is normal, not a special case.
        </li>
        <li>
          <strong>Events are facts; effects are intent</strong> — reducers are pure. Side effects
          cross a boundary and come back as facts, so replay and debugging never double-charge or
          double-call.
        </li>
        <li>
          <strong>Waits hold zero compute</strong> — park until a signal, child completion, or
          timer; resume with full fidelity.
        </li>
      </ul>
      <p>
        The result is closer to a declarative runtime for durable computation than to a task queue
        with LLM helpers bolted on. The React analogy is intentional: you describe transitions; the
        host owns scheduling, recovery, and replay. Details in{' '}
        <Link to="/docs/concepts">Concepts</Link>; formal specs in <Link to="/docs/math">Math</Link>
        .
      </p>

      <h2>Composable like packages</h2>
      <p>
        The kernel is intentionally ignorant of agents and DAGs. Those behaviors arrive as{' '}
        <strong>runtime modules</strong> — packages that register namespaced events, effects, thread
        kinds, and projections:
      </p>
      <CodeBlock lang="ts">{`import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { workflow } from '@looms/workflow'
import { createLooms } from '@looms/runtime'
import { payments } from './modules/payments'

const looms = createLooms({
  definitions: [assistant, checkout],
  modules: [agent({ llm }), workflow(), approval(), payments()],
})`}</CodeBlock>
      <p>
        A payments service can ship workflow + approval + a custom charges module and skip agents
        entirely. An assistant can treat that checkout workflow as a tool. Modules compose because
        they share the event stream and the effect instruction set (<code>invoke</code>,{' '}
        <code>spawn</code>, <code>emit</code>, <code>wait</code>) — not because they share a
        framework base class. See <Link to="/docs/modules">Modules</Link>.
      </p>

      <h2>From execution to UI and indexes</h2>
      <p>
        Once history is a log, read models stop being a second source of truth. A{' '}
        <strong>projection</strong> is a pure fold: chat transcripts, approval queues, financial
        ledgers, debugger timelines. The same reducer runs on the host and in the browser via
        <code>@looms/react</code>, so the UI cannot drift from what happened.
      </p>
      <FlowChain steps={['Run stream', 'Pure fold', 'UI projections', 'DB projectors']} />
      <p>
        <strong>Projectors</strong> watch the store across runs and maintain queryable tables
        (SQLite, Postgres) or fan out to lakes and webhooks — including optional{' '}
        <code>s2Projector</code> for a global stream lake. Walkthrough:{' '}
        <Link to="/docs/projectors">Projections &amp; Projectors</Link>.
      </p>

      <h2>Where runs stay durable</h2>
      <p>
        In production, runs execute within isolated single-writer actor cells. Each cell owns an
        embedded SQLite log and manages timer alarms locally:
      </p>
      <ul>
        <li>
          <strong>Cloudflare Durable Objects (recommended):</strong> Named cells with embedded
          SQLite (<code>ctx.storage.sql</code>) and alarm-driven durable waits via{' '}
          <code>@looms/cloudflare</code>.
        </li>
        <li>
          <strong>celld:</strong> The exact same Workers and Durable Objects bundle running
          self-hosted with S3-compatible replication.
        </li>
        <li>
          <strong>Local Bun actors:</strong> In-process actor host with per-run SQLite files for
          rapid local development via <code>@looms/actor</code>.
        </li>
      </ul>
      <p>
        Downstream, projectors replicate committed events to persistent databases (Postgres, SQLite)
        or stream lakes (S2) for cross-run indexing and analytics. Read the full guide in{' '}
        <Link to="/docs/durability">Durability &amp; Hosting</Link>.
      </p>

      <h2>How to read these docs</h2>
      <ol>
        <li>
          <Link to="/docs/concepts">Concepts</Link> — vocabulary, event/effect boundary, thread
          tree, waits, replay.
        </li>
        <li>
          <Link to="/docs/durability">Durability</Link> — Cloudflare DOs, celld, Bun actors, BYO
          hosts, and S2 as a lake.
        </li>
        <li>
          <Link to="/docs/modules">Modules</Link> — agents, workflows, approvals, and writing your
          own package.
        </li>
        <li>
          <Link to="/docs/projectors">Projections</Link> — reactive UI, time-travel, cross-run
          indexes.
        </li>
        <li>
          <Link to="/docs/quickstart">Quickstart</Link> and{' '}
          <Link to="/docs/examples">Examples</Link> — run the demo, then copy patterns into an app.
        </li>
        <li>
          <Link to="/docs/api">API / SDK</Link> and <Link to="/docs/math">Math</Link> — reference
          and formalism when you need them.
        </li>
      </ol>
    </>
  )
}
