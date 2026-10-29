import { useState } from 'react'

import { conversation } from '@swirls/looms/agent'
import { useLiveFold, useProjection, useRunStore, useRunSummary } from '@swirls/looms/react'

import { postMessage } from '../api'
import { streamingText } from '../streaming'
import { LiveDot } from './marks'

const SUGGESTIONS = [
  'Where is PRO 1841933?',
  'Classify PRO 2208144',
  'Open a recovery for PRO 1841933',
]

export function DeskChat({
  runId,
  onRun,
}: {
  runId: string | null
  onRun: (runId: string) => void
}) {
  return (
    <div className="desk">
      {runId ? (
        <Transcript runId={runId} />
      ) : (
        <p className="empty">Ask about a PRO on today's board.</p>
      )}
      <Composer onRun={onRun} />
    </div>
  )
}

function Transcript({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const transcript = useProjection(store, conversation)
  const live = useLiveFold(store, streamingText)
  const draft = live.parts.join('')

  return (
    <div className="transcript" aria-live="polite">
      <div className="transcript-head">
        <LiveDot connection={summary.connection} />
      </div>
      {transcript.lines.map((line, index) => (
        <Line
          key={`${line.role}-${index}`}
          role={line.role}
          name={line.name}
          content={line.content}
        />
      ))}
      {draft ? <p className="bubble bubble-assistant">{draft}</p> : null}
    </div>
  )
}

function Line({
  role,
  name,
  content,
}: {
  role: string
  name: string | undefined
  content: string
}) {
  if (role === 'system') {
    return null
  }

  if (role === 'tool') {
    const label = toolLabel(name)
    return label ? <p className="tool-line">{label}</p> : null
  }

  if (!content) {
    return null
  }

  const speaker = role === 'user' ? 'bubble bubble-user' : 'bubble bubble-assistant'
  return <p className={speaker}>{content}</p>
}

function Composer({ onRun }: { onRun: (runId: string) => void }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  function send(next: string) {
    const trimmed = next.trim()

    if (!trimmed || sending) {
      return
    }

    setSending(true)
    setError(undefined)

    void postMessage({ text: trimmed }).then(
      (result) => {
        setText('')
        setSending(false)
        onRun(result.runId)
      },
      (cause) => {
        setSending(false)
        setError(cause instanceof Error ? cause.message : 'The desk did not take that message')
      },
    )
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
        send(text)
      }}
    >
      <div className="suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="button button-quiet"
            disabled={sending}
            onClick={() => send(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="desk-message">
        Message
      </label>
      <textarea
        id="desk-message"
        className="composer-input"
        rows={3}
        maxLength={2000}
        value={text}
        placeholder="Ask about a PRO, or ask to classify one"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send(text)
          }
        }}
      />
      <div className="composer-row">
        <button type="submit" className="button" disabled={sending || text.trim().length === 0}>
          {sending ? 'Sending…' : 'Send'}
        </button>
        <p className="quiet">
          A recovery opened here stays on this conversation. The board is where a case is tracked.
        </p>
      </div>
      {error ? <p className="banner">{error}</p> : null}
    </form>
  )
}

function toolLabel(name: string | undefined): string | undefined {
  switch (name) {
    case 'lookup_shipment':
      return 'Looked up the shipment'
    case 'classify_exception':
      return 'Classified the exception'
    case 'recover_shipment':
      return 'Opened a recovery'
    default:
      return undefined
  }
}
