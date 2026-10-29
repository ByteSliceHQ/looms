import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { fetchDesk } from '../api'
import { DeskChat } from '../components/desk-chat'
import { PageHeader } from '../components/shell'

export const Route = createFileRoute('/desk')({
  loader: () => fetchDesk(),
  component: DeskPage,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function DeskPage() {
  const session = Route.useLoaderData()
  const [runId, setRunId] = useState(session.runId)

  return (
    <>
      <PageHeader
        kicker="Floor desk"
        title="Ask the dispatcher"
        copy="Look up a PRO, ask whether it can recover on its own, or open a recovery without leaving the conversation."
      />
      <DeskChat runId={runId} onRun={setRunId} />
    </>
  )
}
