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
        Looms is an Effect-based actor runtime. Every agent turn and workflow node
        appends to an ordered event stream. Reduce the log to recover state, park on
        HITL or child actors, and resume after crashes.
      </p>
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
