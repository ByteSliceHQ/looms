import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { fetchDesk, setKill, startEod } from '../api'
import { PageHeader } from '../components/shell'

export const Route = createFileRoute('/risk')({
  loader: () => fetchDesk(),
  component: Risk,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function Risk() {
  const desk = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  return (
    <div>
      <PageHeader title="Risk" detail={desk.killed ? 'Kill switch on' : 'Kill switch off'} />
      <div className="row">
        <button
          type="button"
          className={desk.killed ? 'danger' : undefined}
          onClick={() => {
            setError('')

            void setKill(!desk.killed).then(
              () => router.invalidate(),
              (cause: Error) => setError(cause.message),
            )
          }}
        >
          {desk.killed ? 'Resume trading' : 'Kill switch'}
        </button>
        <button
          type="button"
          onClick={() => {
            setError('')

            void startEod().then(
              (started) => navigate({ to: '/eod/$runId', params: { runId: started.runId } }),
              (cause: Error) => setError(cause.message),
            )
          }}
        >
          Run end of day
        </button>
        <span className="muted">
          Live cap {desk.maxOrderUsd} / day {desk.maxDayUsd}
          {desk.live ? ' · LIVE' : ''}
        </span>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      <h2>Approvals</h2>
      <ul className="sessions">
        {desk.approvals.map((approval) => (
          <li key={approval.approvalId}>
            <Link to="/sessions/$runId" params={{ runId: approval.runId }}>
              {approval.title}
            </Link>
            <span>{approval.status}</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        Open book run <code>{desk.openRunId}</code> · close <code>{desk.eodRunId}</code>
      </p>
    </div>
  )
}
