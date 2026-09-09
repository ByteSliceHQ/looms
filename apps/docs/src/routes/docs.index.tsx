import { createFileRoute, Link } from '@tanstack/react-router'
import { docsNav } from '../nav'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <>
      <h1>Docs</h1>
      <p>
        Looms is an event-sourced execution runtime for long-running work: LLM agents,
        DAG workflows, human approvals, and your own domain modules. You compose the
        capabilities your app needs, start a <strong>run</strong>, and every client and
        worker observes the same durable event log.
      </p>

      <div className="flow">
        <span>Event</span><b>&rarr;</b><span>Pure Reducer</span><b>&rarr;</b><span>State + Effects</span><b>&rarr;</b><span>World</span><b>&rarr;</b><span>Event</span>
      </div>

      <p>
        The architecture is built on a small, mathematically grounded kernel:
      </p>
      <ul>
        <li>
          <strong>Runs are durability boundaries:</strong> A Run is a canonical append-only
          log of immutable events.
        </li>
        <li>
          <strong>Threads are computation units:</strong> Every agent, workflow, or custom
          node is a Thread governed by a deterministic state transition function.
        </li>
        <li>
          <strong>Events are facts; Effects are intent:</strong> State transitions only occur
          via events. Side-effects cross into reality and return new events.
        </li>
        <li>
          <strong>Projections derive state:</strong> Read models fold history into reactive UI
          and server state without drift.
        </li>
      </ul>

      <p className="muted">
        Looking for the formal algebraic model? Read the <Link to="/docs/math">Math</Link> specifications.
      </p>

      <p>Explore the documentation:</p>
      <ul>
        {docsNav.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
