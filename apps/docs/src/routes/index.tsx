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
      <Link to="/docs/quickstart" className="cta">
        Get started
      </Link>
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
