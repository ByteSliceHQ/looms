import { createFileRoute, Link } from '@tanstack/react-router'
import { docsNav } from '../nav'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="landing">
      <p className="landing-brand">Looms</p>
      <h2>Deploy durable agents and workflows.</h2>
      <p>Subscribe from any client via an event log.</p>
      <Link to="/docs/quickstart" className="cta">
        Quickstart
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
