import { Activity, GitBranch, ListTree } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'

import type { DefinitionCatalog } from '@looms/core'

import { DebuggerProvider, useDebugger } from '../context'
import { errorMessage } from '../lib/cn'
import type { DebuggerPlugin } from '../plugin'
import { EmptyState, PanelHeader, PanelTitle } from '../ui/panel'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { definitionKey } from './definition-key'
import { EventsPane, RunTreePane } from './events-pane'
import { ProjectionsPanel } from './projections-panel'
import { RunControls } from './run-controls'
import { RunSearch } from './run-search'
import { RunTypeMenu } from './run-type-menu'
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

function Brand() {
  return (
    <div className="flex shrink-0 items-center gap-2 pr-1">
      <span className="bg-foreground text-background flex size-5 items-center justify-center rounded-md">
        <GitBranch className="size-3" strokeWidth={2.5} />
      </span>
      <span className="text-[13px] font-semibold tracking-tight">Looms</span>
    </div>
  )
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

  const layout = useDefaultLayout({ id: 'looms-debugger-columns', storage: localStorage })

  return (
    <div className="looms-debugger bg-background text-foreground flex h-full flex-col overflow-hidden font-sans antialiased">
      <header className="border-border bg-sidebar flex h-11 shrink-0 items-center gap-2 border-b px-3">
        <Brand />
        <span className="text-border text-lg font-light select-none" aria-hidden>
          /
        </span>
        <RunTypeMenu
          definitions={catalog.definitions}
          selected={selected}
          onSelect={(definition) =>
            onSelectionChange({ kind: definition.kind, name: definition.name })
          }
        />
        <RunSearch
          runId={selection.run}
          fallbackLabel={selected?.name}
          onSelectRun={(run) =>
            onSelectionChange({
              kind: run.kind ?? undefined,
              name: run.definitionName ?? undefined,
              run: run.runId,
            })
          }
        />
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {error ? (
            <p className="text-status-failed truncate text-[11px]" title={error}>
              {error}
            </p>
          ) : null}
          {selection.run ? <RunControls runId={selection.run} /> : null}
        </div>
      </header>
      <ResizablePanelGroup
        id="looms-debugger-columns"
        className="min-h-0 flex-1"
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
      >
        <ResizablePanel
          id="tree"
          defaultSize="17%"
          minSize="12rem"
          maxSize="30%"
          className="bg-sidebar"
        >
          <section aria-label="Run tree" className="h-full min-h-0 overflow-hidden">
            {selection.run ? (
              <RunTreePane
                runId={selection.run}
                threadId={selection.thread}
                onSelectThread={(thread) =>
                  onSelectionChange({ ...selection, thread, seq: undefined })
                }
              />
            ) : (
              <div className="flex h-full flex-col">
                <PanelHeader>
                  <PanelTitle>Run tree</PanelTitle>
                </PanelHeader>
                <EmptyState icon={<ListTree />} title="No run selected">
                  Threads and child runs appear here once a run starts.
                </EmptyState>
              </div>
            )}
          </section>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="workspace" defaultSize="29%" minSize="16rem">
          <section aria-label="Workspace" className="@container h-full min-h-0 overflow-hidden">
            <Workspace
              definition={selected}
              runId={selection.run}
              onStarted={(run) => onSelectionChange({ kind, name, run })}
            />
          </section>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="events" defaultSize="32%" minSize="16rem">
          <section aria-label="Events" className="h-full min-h-0 overflow-hidden">
            {selection.run ? (
              <EventsPane
                runId={selection.run}
                threadId={selection.thread}
                seq={selection.seq}
                onSelectSeq={(seq) => onSelectionChange({ ...selection, seq })}
                onClearThread={() => onSelectionChange({ ...selection, thread: undefined })}
              />
            ) : (
              <div className="flex h-full flex-col">
                <PanelHeader>
                  <PanelTitle>Events</PanelTitle>
                </PanelHeader>
                <EmptyState icon={<Activity />} title="No events yet">
                  Events stream in live once a run starts.
                </EmptyState>
              </div>
            )}
          </section>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="projections" defaultSize="22%" minSize="14rem" className="bg-sidebar">
          <section aria-label="Projections" className="h-full min-h-0 overflow-hidden">
            <ProjectionsPanel runId={selection.run} names={catalog.projections} />
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
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
