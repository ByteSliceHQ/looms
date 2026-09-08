import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router'
import { RunDebugger } from '../components/run-debugger'

export const Route = createFileRoute('/runs/$runId')({
  ssr: false,
  component: RunPage,
})

function RunPage() {
  const { runId } = Route.useParams()
  return (
    <div className="stack">
      <div className="row">
        <Link to="/">← Start another</Link>
        <Link to="/chat/$runId" params={{ runId }}>
          Chat
        </Link>
        <code>{runId}</code>
      </div>
      <ClientOnly fallback={<p className="muted">Loading run…</p>}>
        <RunDebugger runId={runId} />
      </ClientOnly>
    </div>
  )
}
