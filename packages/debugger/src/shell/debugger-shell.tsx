import { useEffect, useState } from 'react'

import type { DefinitionCatalog } from '@looms/core'

import { DebuggerProvider, useDebugger } from '../context'
import { errorMessage } from '../lib/cn'
import type { DebuggerPlugin } from '../plugin'
import { definitionKey } from './definition-key'
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

const emptyCatalog: DefinitionCatalog = { definitions: [], projections: [] }

function useDefinitionCatalog() {
  const { client } = useDebugger()
  const [catalog, setCatalog] = useState(emptyCatalog)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    client.listDefinitions().then(setCatalog, (cause: unknown) => setError(errorMessage(cause)))
  }, [client])

  return { catalog, error }
}

function DebuggerFrame({
  selection,
  onSelectionChange,
}: {
  selection: DebuggerSelection
  onSelectionChange: (selection: DebuggerSelection) => void
}) {
  const { catalog, error } = useDefinitionCatalog()
  const { kind, name } = selection
  const selectedKey = kind && name ? definitionKey({ kind, name }) : undefined

  const selected = catalog.definitions.find(
    (definition) => definitionKey(definition) === selectedKey,
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="border-border flex items-center gap-3 border-b px-3 py-2">
        <h1 className="text-sm font-medium">Looms debugger</h1>
        {error ? <p className="text-status-failed text-xs">{error}</p> : null}
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1.1fr)_minmax(0,1.4fr)_18rem]">
        <section className="border-border bg-sidebar min-h-0 overflow-auto border-r">
          <Sidebar
            definitions={catalog.definitions}
            selectedKey={selectedKey}
            runId={selection.run}
            threadId={selection.thread}
            onSelectDefinition={(definition) =>
              onSelectionChange({ kind: definition.kind, name: definition.name })
            }
            onSelectRun={(run) =>
              onSelectionChange({
                kind: run.kind ?? undefined,
                name: run.definitionName ?? undefined,
                run: run.runId,
              })
            }
            onSelectThread={(thread) => onSelectionChange({ ...selection, thread })}
          />
        </section>
        <section className="border-border min-h-0 overflow-hidden border-r">
          <Workspace
            definition={selected}
            runId={selection.run}
            onStarted={(run) => onSelectionChange({ kind, name, run })}
          />
        </section>
        <section className="border-border min-h-0 overflow-hidden border-r">
          {selection.run ? (
            <EventsPane
              runId={selection.run}
              threadId={selection.thread}
              seq={selection.seq}
              onSelectSeq={(seq) => onSelectionChange({ ...selection, seq })}
            />
          ) : (
            <p className="text-muted-foreground p-3 text-xs">Events appear after a run starts.</p>
          )}
        </section>
        <section className="min-h-0 overflow-auto">
          {selection.run ? (
            <ProjectionsPanel runId={selection.run} names={catalog.projections} />
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
  endpoint,
}: {
  plugins: readonly DebuggerPlugin[]
  selection: DebuggerSelection
  onSelectionChange: (selection: DebuggerSelection) => void
  /** Looms host base URL. Defaults to the page origin. */
  endpoint?: string
}) {
  return (
    <DebuggerProvider endpoint={endpoint} plugins={plugins}>
      <DebuggerFrame selection={selection} onSelectionChange={onSelectionChange} />
    </DebuggerProvider>
  )
}
