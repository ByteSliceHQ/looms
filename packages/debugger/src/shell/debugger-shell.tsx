import { useEffect, useState } from 'react'

import type { LoomsClient, LoomsDefinition } from '@looms/client'
import { LoomsProvider } from '@looms/react'

import { DebuggerProvider, useDebugger } from '../context'
import type { DebuggerPlugin } from '../plugin'
import { EventsPane } from './events-pane'
import { ProjectionsPanel } from './projections-panel'
import { Sidebar } from './sidebar'
import { Workspace } from './workspace'

export interface DebuggerSelection {
  readonly kind?: string
  readonly name?: string
  readonly run?: string
  readonly thread?: string
  readonly seq?: number
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function DebuggerFrame({
  selection,
  onSelectionChange,
}: {
  selection: DebuggerSelection
  onSelectionChange: (selection: DebuggerSelection) => void
}) {
  const { client } = useDebugger()
  const [definitions, setDefinitions] = useState<readonly LoomsDefinition[]>([])
  const [projections, setProjections] = useState<readonly string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    client
      .listDefinitions()
      .then((catalog) => {
        setDefinitions(catalog.definitions)
        setProjections(catalog.projections)
      })
      .catch((cause: unknown) => {
        setError(messageOf(cause))
      })
  }, [client])

  const selected =
    definitions.find(
      (definition) => definition.kind === selection.kind && definition.name === selection.name,
    ) ?? definitions.find((definition) => definition.name === selection.name)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="border-border flex items-center gap-3 border-b px-3 py-2">
        <h1 className="text-sm font-medium">Looms debugger</h1>
        {error ? <p className="text-status-failed text-xs">{error}</p> : null}
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1.1fr)_minmax(0,1.4fr)_18rem]">
        <section className="border-border bg-sidebar min-h-0 overflow-auto border-r">
          <Sidebar
            definitions={definitions}
            selectedName={selected?.name}
            runId={selection.run}
            threadId={selection.thread}
            onSelectDefinition={(definition) =>
              onSelectionChange({ kind: definition.kind, name: definition.name })
            }
            onSelectRun={(run) =>
              onSelectionChange({ kind: run.kind, name: run.definitionName, run: run.runId })
            }
            onSelectThread={(thread) =>
              onSelectionChange({
                kind: selection.kind,
                name: selection.name,
                run: selection.run,
                thread,
                seq: selection.seq,
              })
            }
          />
        </section>
        <section className="border-border min-h-0 overflow-hidden border-r">
          <Workspace
            definition={selected}
            runId={selection.run}
            onStarted={(runId) =>
              onSelectionChange({ kind: selected?.kind, name: selected?.name, run: runId })
            }
          />
        </section>
        <section className="border-border min-h-0 overflow-hidden border-r">
          {selection.run ? (
            <EventsPane
              runId={selection.run}
              threadId={selection.thread}
              seq={selection.seq}
              onSelectSeq={(seq) =>
                onSelectionChange({
                  kind: selection.kind,
                  name: selection.name,
                  run: selection.run,
                  thread: selection.thread,
                  seq,
                })
              }
            />
          ) : (
            <p className="text-muted-foreground p-3 text-xs">Events appear after a run starts.</p>
          )}
        </section>
        <section className="min-h-0 overflow-auto">
          {selection.run ? (
            <ProjectionsPanel runId={selection.run} names={projections} />
          ) : (
            <p className="text-muted-foreground p-3 text-xs">
              Projections fold the same event log.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export function DebuggerShell({
  plugins,
  selection,
  onSelectionChange,
  client,
}: {
  plugins: readonly DebuggerPlugin[]
  selection: DebuggerSelection
  onSelectionChange: (selection: DebuggerSelection) => void
  client?: LoomsClient
}) {
  return (
    <LoomsProvider>
      <DebuggerProvider client={client} plugins={plugins}>
        <DebuggerFrame selection={selection} onSelectionChange={onSelectionChange} />
      </DebuggerProvider>
    </LoomsProvider>
  )
}
