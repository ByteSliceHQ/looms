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
        Looms is an SDK for long-running work: LLM agents, DAG workflows, human
        approvals, and your own domain modules. You compose the pieces you need,
        start a <strong>run</strong>, and every client sees the same event log.
      </p>
      <p>Use these pages to wire Looms into an application:</p>
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
