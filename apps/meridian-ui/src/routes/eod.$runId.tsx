import { createFileRoute } from '@tanstack/react-router'

import { SessionDesk } from '../components/session'
import { PageHeader } from '../components/shell'

export const Route = createFileRoute('/eod/$runId')({
  component: EndOfDay,
})

function EndOfDay() {
  const { runId } = Route.useParams()

  return (
    <div>
      <PageHeader title="End of day" detail="Attribution from the fills copied into D1" />
      <SessionDesk runId={runId} />
    </div>
  )
}
