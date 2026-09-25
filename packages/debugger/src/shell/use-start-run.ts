import { useState } from 'react'

import { createRunId, type JsonValue } from '@looms/core'

import { useDebugger } from '../context'
import { errorMessage } from '../lib/cn'
import type { WorkspaceContext } from '../plugin'

export interface StartRun {
  /** Starts a run of the workspace definition, then runs `after` once the start is accepted. */
  readonly start: <T>(input: JsonValue, after?: (runId: string) => Promise<T>) => void
  readonly fail: (cause: unknown) => void
  readonly pending: boolean
  readonly error: string | null
}

export function useStartRun({ definition, onStarted }: WorkspaceContext): StartRun {
  const { client } = useDebugger()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function start<T>(input: JsonValue, after?: (runId: string) => Promise<T>) {
    const runId = createRunId()
    setPending(true)
    setError(null)
    onStarted(runId)

    client
      .startRun({
        kind: definition.kind,
        definitionName: definition.name,
        definitionVersion: definition.version,
        input,
        runId,
      })
      .then(() => after?.(runId))
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setPending(false))
  }

  return {
    start,
    fail: (cause) => setError(errorMessage(cause)),
    pending,
    error,
  }
}
