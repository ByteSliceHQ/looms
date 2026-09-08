import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router'
import { ChatPanel } from '../components/chat-panel'

export const Route = createFileRoute('/chat/$runId')({
  ssr: false,
  component: ChatRunPage,
})

function ChatRunPage() {
  const { runId } = Route.useParams()
  return (
    <div className="stack">
      <div className="row">
        <Link to="/chat">← New chat</Link>
        <Link to="/runs/$runId" params={{ runId }}>
          Debugger
        </Link>
        <code>{runId}</code>
      </div>
      <ClientOnly fallback={<p className="muted">Loading chat…</p>}>
        <ChatPanel runId={runId} />
      </ClientOnly>
    </div>
  )
}
