import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { useLiveFold, useRunStore } from '@swirls/looms/react'

import { fetchDesk, postAnalyst } from '../api'
import { PageHeader } from '../components/shell'
import { streamingText } from '../streaming'

export const Route = createFileRoute('/analyst')({
  loader: () => fetchDesk(),
  component: Analyst,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function Analyst() {
  const desk = Route.useLoaderData()
  const [runId, setRunId] = useState(desk.analystRunId)
  const [text, setText] = useState('quote NVDA')
  const [error, setError] = useState('')

  return (
    <div>
      <PageHeader title="Analyst" detail="Quotes, the book, and session control" />
      <form
        className="ticket"
        onSubmit={(event) => {
          event.preventDefault()
          const message = text.trim()

          if (!message) {
            return
          }

          setError('')

          void postAnalyst(message).then(
            (started) => {
              setRunId(started.runId)
              setText('')
            },
            (cause: Error) => setError(cause.message),
          )
        }}
      >
        <label>
          Message
          <input value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit">Send</button>
      </form>
      {error ? <p className="banner">{error}</p> : null}
      {runId ? <Transcript runId={runId} /> : <p className="muted">No conversation yet.</p>}
    </div>
  )
}

function Transcript({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const text = useLiveFold(store, streamingText)
  const shown = text.committed.concat(text.live).join('\n')

  return (
    <div>
      <ul className="tools">
        {text.tools.map((tool) => (
          <li key={tool.id}>
            <strong>{tool.name}</strong>
            <span>{tool.detail}</span>
          </li>
        ))}
      </ul>
      <p className="transcript">{shown || 'Waiting for the analyst.'}</p>
    </div>
  )
}
