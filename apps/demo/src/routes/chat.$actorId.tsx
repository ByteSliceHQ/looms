import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router'
import { useActorStore } from '@looms/livestore/react'
import { Suspense } from 'react'
import { ChatPanel } from '../components/chat-panel'
import { ChildReviews } from '../components/child-reviews'
import { EventFeed } from '../components/event-feed'
import { SyncBadge } from '../components/sync-badge'

export const Route = createFileRoute('/chat/$actorId')({
  ssr: false,
  component: ChatActorPage,
})

function ChatActorPage() {
  const { actorId } = Route.useParams()

  return (
    <div className="stack">
      <div className="row">
        <Link to="/chat">← New chat</Link>
        <Link to="/">Start panel</Link>
        <code>{actorId}</code>
      </div>
      <ClientOnly fallback={<p className="muted">Loading LiveStore…</p>}>
        <Suspense fallback={<p className="muted">Loading LiveStore…</p>}>
          <ChatActorView actorId={actorId} />
        </Suspense>
      </ClientOnly>
    </div>
  )
}

function ChatActorView({ actorId }: { actorId: string }) {
  const store = useActorStore(actorId)
  return (
    <div className="stack">
      <div className="row">
        <SyncBadge store={store} />
      </div>
      <div className="chat-layout">
        <ChatPanel store={store} />
        <div className="stack">
          <EventFeed store={store} actorId={actorId} />
          <ChildReviews store={store} actorId={actorId} />
        </div>
      </div>
    </div>
  )
}
