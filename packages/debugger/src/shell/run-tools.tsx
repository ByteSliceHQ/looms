import { useState } from 'react'

import { cleanUndefined, type EventInput } from '@looms/core'
import { useRunStore, useRunSummary } from '@looms/react'

import { useDebugger } from '../context'
import { errorMessage } from '../lib/cn'

const CANCEL_TYPE = 'runtime.thread.cancel.requested'

export function RunTools({ runId }: { runId: string }) {
  const { client } = useDebugger()
  const { rootThreadId } = useRunSummary(useRunStore(runId))
  const [type, setType] = useState(CANCEL_TYPE)
  const [payload, setPayload] = useState('{}')
  const [thread, setThread] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const threadId = thread || rootThreadId

  function run<T>(action: () => Promise<T>) {
    setPending(true)
    setError(null)

    action()
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setPending(false))
  }

  function send(event: EventInput) {
    run(() => client.signal(runId, [event]))
  }

  function signal() {
    try {
      send({ type, payload: cleanUndefined(JSON.parse(payload)), threadId })
    } catch (cause: unknown) {
      setError(errorMessage(cause))
    }
  }

  return (
    <div className="border-border space-y-2 border-t p-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bg-secondary rounded px-2 py-1 text-xs"
          disabled={pending}
          onClick={() => run(() => client.wake(runId))}
        >
          Wake
        </button>
        <button
          type="button"
          className="bg-secondary rounded px-2 py-1 text-xs"
          disabled={pending}
          onClick={() => send({ type: CANCEL_TYPE, payload: { threadId: threadId ?? '' } })}
        >
          Cancel
        </button>
      </div>
      <div className="grid gap-2">
        <input
          className="border-border bg-background rounded border px-2 py-1 font-mono text-xs"
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label="Signal type"
        />
        <input
          className="border-border bg-background rounded border px-2 py-1 font-mono text-xs"
          value={thread}
          placeholder="thread id"
          onChange={(event) => setThread(event.target.value)}
          aria-label="Signal thread"
        />
        <textarea
          className="border-border bg-background min-h-16 rounded border px-2 py-1 font-mono text-xs"
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          aria-label="Signal payload"
        />
        <button
          type="button"
          className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs"
          disabled={pending || type.length === 0}
          onClick={signal}
        >
          Signal
        </button>
      </div>
      {error ? <p className="text-status-failed text-xs">{error}</p> : null}
    </div>
  )
}
