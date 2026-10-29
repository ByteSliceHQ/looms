import { Link, createFileRoute } from '@tanstack/react-router'

import { digest } from '@looms/northline/views'
import { useProjection, useRunStore, useRunSummary } from '@swirls/looms/react'

import { LiveDot } from '../components/marks'
import { PageHeader } from '../components/shell'
import { clock } from '../format'

export const Route = createFileRoute('/digests/$runId')({
  component: DigestPage,
})

function DigestPage() {
  const { runId } = Route.useParams()
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const lanes = useProjection(store, digest)

  return (
    <>
      <Link to="/sweep" className="back">
        Back to the sweep
      </Link>
      <PageHeader
        kicker="Lane digest"
        title={lanes.at ? `${lanes.open} open` : 'Counting the lanes'}
        copy={
          lanes.at
            ? `Counted ${clock(lanes.at)} from the board the desk already holds.`
            : 'The count runs in the actor. It does not cross the recovery queue.'
        }
      />
      <LiveDot connection={summary.connection} />
      {summary.status === 'failed' ? <p className="banner">The digest failed.</p> : null}
      {lanes.at ? (
        <ul className="lanes">
          {lanes.lanes.map((lane) => (
            <li key={lane.destination} className="lane">
              <span className="lane-name">{lane.destination}</span>
              <span className="lane-count">{lane.count}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}
