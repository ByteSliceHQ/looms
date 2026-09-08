import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createLoomsClient } from '@looms/client'
import type { definitions } from '../definitions'

const loomsClient = createLoomsClient<typeof definitions>()

export const Route = createFileRoute('/chat/')({
  component: ChatStartPage,
})

function ChatStartPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onStart() {
    const text = input.trim()
    if (!text) return
    setError(null)
    setPending(true)
    try {
      const result = await loomsClient.startAgent('assistant', text)
      await navigate({ to: '/chat/$actorId', params: { actorId: result.actorId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="panel">
      <h2>Chat</h2>
      <p className="muted">
        Starts the conversational <code>assistant</code> agent. Tools include greet, specialist,
        hitl, and pipeline — watch the event log as the model chooses them.
      </p>
      <div className="row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant to greet someone, or run hitl…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onStart()
          }}
        />
        <button type="button" disabled={pending || input.trim().length === 0} onClick={() => void onStart()}>
          {pending ? 'Starting…' : 'Start chat'}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
