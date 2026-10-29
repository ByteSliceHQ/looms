import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { useProjection, useRunStore, useRunSummary } from '@swirls/looms/react'
import { scheduleStatus } from '@swirls/looms/schedule'

import { fetchSweep, startDigest } from '../api'
import { LiveDot } from '../components/marks'
import { PageHeader } from '../components/shell'
import { clock } from '../format'

export const Route = createFileRoute('/sweep')({
  loader: () => fetchSweep(),
  component: SweepPage,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function SweepPage() {
  const { runId } = Route.useLoaderData()
  const navigate = useNavigate()
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const status = useProjection(store, scheduleStatus)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  function countNow() {
    if (pending) {
      return
    }

    setPending(true)
    setError(undefined)

    void startDigest({ at: Date.now() }).then(
      (result) => {
        void navigate({ to: '/digests/$runId', params: { runId: result.runId } })
      },
      (cause) => {
        setPending(false)
        setError(cause instanceof Error ? cause.message : 'Could not count the lanes')
      },
    )
  }

  return (
    <>
      <PageHeader
        kicker="Morning sweep"
        title="Open exceptions by lane"
        copy="Weekdays at 13:00 UTC the desk counts what is still open. You can run that count now."
      />
      <div className="sweep-bar">
        <LiveDot connection={summary.connection} />
        <p className="case-meta">
          {status.nextAt ? `Next fire ${clock(status.nextAt)}` : 'Waiting for the next fire'}
          {` · ${status.fireCount} fired`}
        </p>
        <button type="button" className="button" disabled={pending} onClick={countNow}>
          {pending ? 'Counting…' : 'Count open exceptions'}
        </button>
      </div>
      {error ? <p className="banner">{error}</p> : null}
      <section className="panel">
        <h2 className="panel-title">Recent fires</h2>
        {status.recent.length === 0 ? (
          <p className="empty">The sweep has not fired yet.</p>
        ) : (
          <ul className="stack">
            {status.recent.map((fire) => (
              <li key={`${fire.at}-${fire.runId ?? 'skipped'}`} className="fire">
                <span>{clock(fire.at)}</span>
                <span className="quiet">{fire.outcome === 'fired' ? 'Fired' : 'Skipped'}</span>
                {fire.runId ? (
                  <Link to="/digests/$runId" params={{ runId: fire.runId }} className="back">
                    Open the digest
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
