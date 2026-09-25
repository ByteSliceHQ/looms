import { useState } from 'react'

import { cleanUndefined } from '@looms/core'
import { useRunStore, useRunSummary } from '@looms/react'

import { useDebugger } from '../context'

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

export function RunTools({ runId, threadId }: { runId: string; threadId?: string }) {
  const { client } = useDebugger()
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const [type, setType] = useState('runtime.thread.cancel.requested')
  const [payload, setPayload] = useState('{}')
  const [thread, setThread] = useState(threadId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function run(action: () => Promise<void>) {
    setPending(true)
    setError(null)

    action()
      .catch((cause: unknown) => setError(messageOf(cause)))
      .finally(() => setPending(false))
  }

  function signal() {
    let parsed

    try {
      parsed = cleanUndefined(JSON.parse(payload))
    } catch (cause: unknown) {
      setError(messageOf(cause))
      return
    }

    run(() =>
      client
        .signal(runId, [
          {
            type,
            payload: parsed,
            threadId: thread || summary.rootThreadId,
          },
        ])
        .then(() => undefined),
    )
  }

  return (
    <div className="border-border space-y-2 border-t p-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bg-secondary rounded px-2 py-1 text-xs"
          disabled={pending}
          onClick={() => run(() => client.wake(runId).then(() => undefined))}
        >
          Wake
        </button>
        <button
          type="button"
          className="bg-secondary rounded px-2 py-1 text-xs"
          disabled={pending}
          onClick={() =>
            run(() =>
              client
                .signal(runId, [
                  {
                    type: 'runtime.thread.cancel.requested',
                    payload: { threadId: thread || summary.rootThreadId || '' },
                  },
                ])
                .then(() => undefined),
            )
          }
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
