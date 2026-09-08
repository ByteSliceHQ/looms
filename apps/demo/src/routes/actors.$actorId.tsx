import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router'
import { useActorStore } from '@looms/livestore/react'
import { Suspense } from 'react'
import { MaterializedView } from '../components/materialized-view'

export const Route = createFileRoute('/actors/$actorId')({
  ssr: false,
  component: ActorPage,
})

function ActorPage() {
  const { actorId } = Route.useParams()

  return (
    <div className="stack">
      <div className="row">
        <Link to="/">← Start another</Link>
        <code>{actorId}</code>
      </div>
      <ClientOnly fallback={<p className="muted">Loading LiveStore…</p>}>
        <Suspense fallback={<p className="muted">Loading LiveStore…</p>}>
          <ActorStoreView actorId={actorId} />
        </Suspense>
      </ClientOnly>
    </div>
  )
}

function ActorStoreView({ actorId }: { actorId: string }) {
  const store = useActorStore(actorId)
  return <MaterializedView store={store} actorId={actorId} />
}
