import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { fetchSession } from '../api'
import { SessionDesk } from '../components/session'
import { PageHeader } from '../components/shell'

export const Route = createFileRoute('/sessions/$runId')({
  loader: ({ params }) => fetchSession(params.runId),
  component: SessionPage,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function SessionPage() {
  const { runId } = Route.useParams()
  const { session, replica } = Route.useLoaderData()
  const router = useRouter()
  const copy = replica.copy

  const settled =
    session.status === 'completed' || session.status === 'failed' || session.status === 'cancelled'

  useEffect(() => {
    if (settled) {
      return () => undefined
    }

    const timer = window.setInterval(() => {
      void router.invalidate()
    }, 1000)

    return () => window.clearInterval(timer)
  }, [router, settled])

  return (
    <div>
      <PageHeader
        title={`${session.symbol} ${session.strategy}`}
        detail={`${session.status} · ${session.venue === 'robinhood' ? 'LIVE' : 'sim'}`}
      />
      <p className="muted">
        {replica.attached
          ? `Replica seq ${copy?.replicatedSeq ?? 0}${copy?.complete ? ' · complete' : ''}`
          : 'Replica not attached'}
      </p>
      <SessionDesk runId={runId} />
    </div>
  )
}
