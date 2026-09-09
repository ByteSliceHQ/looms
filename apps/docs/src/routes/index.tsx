import { createFileRoute, Link } from '@tanstack/react-router'
import { docsNav } from '../nav'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="landing">
      <p className="landing-brand">Looms</p>
      <h2>Durable agents, workflows, and human approvals — composed like packages.</h2>
      <p>Each run is an event log you can replay, subscribe to, and extend with your own domain.</p>

      <div className="flow">
        <span>Event</span><b>&rarr;</b><span>Reducer</span><b>&rarr;</b><span>State + Effects</span><b>&rarr;</b><span>World</span><b>&rarr;</b><span>Event</span>
      </div>

      <p>
        Under the hood, a <strong>Run</strong> is an append-only event log. Universal{' '}
        <strong>Threads</strong> (agents, workflows, human approvals) process incoming events
        through deterministic reducers and request effects. <strong>Projections</strong> fold this
        stream into real-time reactive UI state and indexes.
      </p>

      <div style={{ margin: '1.5rem 0' }}>
        <Link to="/docs/quickstart" className="cta">
          Get started
        </Link>
      </div>

      <ul className="landing-links">
        {docsNav.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
