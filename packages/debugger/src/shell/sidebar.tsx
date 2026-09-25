import { useEffect, useState } from 'react'

import type { PublishedDefinition, RunSummary } from '@looms/core'

import { StatusDot } from '../components/status-dot'
import { useDebugger } from '../context'
import { errorMessage } from '../lib/cn'
import { definitionKey } from './definition-key'
import { RunTreePane } from './events-pane'

const headingClass =
  'text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase'

function useRunSummaries(runId: string | undefined) {
  const { client } = useDebugger()
  const [runs, setRuns] = useState<readonly RunSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    client.listRunSummaries().then(
      (listed) => {
        if (active) {
          setRuns(listed.runs)
          setError(null)
        }
      },
      (cause: unknown) => {
        if (active) {
          setError(errorMessage(cause))
        }
      },
    )

    return () => {
      active = false
    }
  }, [client, runId])

  return { runs, error }
}

export function Sidebar({
  definitions,
  selectedKey,
  runId,
  threadId,
  onSelectDefinition,
  onSelectRun,
  onSelectThread,
}: {
  definitions: readonly PublishedDefinition[]
  selectedKey?: string
  runId?: string
  threadId?: string
  onSelectDefinition: (definition: PublishedDefinition) => void
  onSelectRun: (run: RunSummary) => void
  onSelectThread: (threadId: string | undefined) => void
}) {
  const { runs, error } = useRunSummaries(runId)
  const kinds = [...new Set(definitions.map((definition) => definition.kind))]

  return (
    <div className="space-y-4 py-3">
      <section>
        <h2 className={headingClass}>Run types</h2>
        {kinds.map((kind) => (
          <div key={kind} className="mb-2">
            <p className="text-muted-foreground px-2 text-[10px]">{kind}</p>
            <ul>
              {definitions
                .filter((definition) => definition.kind === kind)
                .map((definition) => (
                  <li key={definitionKey(definition)}>
                    <button
                      type="button"
                      className={`hover:bg-accent/50 w-full truncate px-2 py-1 text-left text-xs ${
                        selectedKey === definitionKey(definition) ? 'bg-accent' : ''
                      }`}
                      onClick={() => onSelectDefinition(definition)}
                    >
                      {definition.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="border-border border-t pt-3">
        {runId ? (
          <RunTreePane runId={runId} threadId={threadId} onSelectThread={onSelectThread} />
        ) : (
          <p className="text-muted-foreground px-2 text-xs">Start a run to see its tree.</p>
        )}
      </section>
      <section className="border-border border-t pt-3">
        <h2 className={headingClass}>Runs</h2>
        {error ? <p className="text-status-failed px-2 text-xs">{error}</p> : null}
        {runs.length === 0 ? (
          <p className="text-muted-foreground px-2 text-xs">No runs yet.</p>
        ) : (
          <ul>
            {runs.map((run) => (
              <li key={run.runId}>
                <button
                  type="button"
                  className={`hover:bg-accent/50 flex w-full items-center gap-1.5 px-2 py-1 text-left text-xs ${
                    runId === run.runId ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSelectRun(run)}
                >
                  <StatusDot status={run.status} />
                  <span className="truncate">{run.definitionName ?? run.runId}</span>
                  <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                    {run.runId.slice(-6)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
