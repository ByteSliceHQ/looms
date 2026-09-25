import { useEffect, useState } from 'react'

import type { LoomsDefinition } from '@looms/client'

import { StatusDot } from '../components/status-dot'
import { useDebugger } from '../context'
import { RunTreePane } from './events-pane'

interface ListedRun {
  readonly runId: string
  readonly status: string
  readonly definitionName: string
  readonly kind: string
}

export function Sidebar({
  definitions,
  selectedName,
  runId,
  threadId,
  onSelectDefinition,
  onSelectRun,
  onSelectThread,
}: {
  definitions: readonly LoomsDefinition[]
  selectedName?: string
  runId?: string
  threadId?: string
  onSelectDefinition: (definition: LoomsDefinition) => void
  onSelectRun: (run: ListedRun) => void
  onSelectThread: (threadId: string | undefined) => void
}) {
  const { client } = useDebugger()
  const [runs, setRuns] = useState<readonly ListedRun[]>([])

  useEffect(() => {
    let active = true

    function load() {
      client
        .listRuns()
        .then((listed) =>
          Promise.all(
            listed.runIds.map((id) =>
              client
                .getStatus(id)
                .then((status) => ({
                  runId: id,
                  status: status.state.status,
                  definitionName: status.state.startIdentity?.definitionName ?? id,
                  kind: status.state.startIdentity?.kind ?? '',
                }))
                .catch(() => undefined),
            ),
          ),
        )
        .then((items) => {
          if (active) {
            setRuns(items.filter((item) => item !== undefined))
          }
        })
        .catch(() => {
          if (active) {
            setRuns([])
          }
        })
    }

    load()

    return () => {
      active = false
    }
  }, [client, runId])

  const groups = definitions.reduce<Map<string, LoomsDefinition[]>>((map, definition) => {
    const group = map.get(definition.kind) ?? []
    group.push(definition)
    map.set(definition.kind, group)
    return map
  }, new Map())

  return (
    <div className="space-y-4 py-3">
      <section>
        <h2 className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
          Run types
        </h2>
        {[...groups.entries()].map(([kind, items]) => (
          <div key={kind} className="mb-2">
            <p className="text-muted-foreground px-2 text-[10px]">{kind}</p>
            <ul>
              {items.map((definition) => (
                <li key={`${definition.kind}:${definition.name}`}>
                  <button
                    type="button"
                    className={`hover:bg-accent/50 w-full truncate px-2 py-1 text-left text-xs ${
                      selectedName === definition.name ? 'bg-accent' : ''
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
        <h2 className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
          Runs
        </h2>
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
                  <span className="truncate">{run.definitionName}</span>
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
