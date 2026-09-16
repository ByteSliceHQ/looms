import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { useRunStore, useRunSummary } from '@swirls/looms/react'

import { catalog, findRunType } from '../../catalog'
import { EventStream } from '../events/event-stream'
import { ProjectionsPanel } from '../projections/projections-panel'
import { RecentRuns } from '../sidebar/recent-runs'
import { RunTree } from '../sidebar/run-tree'
import { RunTypes } from '../sidebar/run-types'
import { Separator } from '../ui/separator'
import { TopBar } from './top-bar'
import { WorkspacePanel } from './workspace-panel'

const route = getRouteApi('/')

export function Shell() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [typeName, setTypeName] = useState(catalog[0]!.name)
  const runId = search.run

  function setSearch(next: { run?: string; thread?: string; seq?: number }) {
    void navigate({
      to: '/',
      search: next,
    })
  }

  function handleSelectType(item: { name: string }) {
    setTypeName(item.name)
    setSearch({})
  }

  function handleSelectRecentRun(run: { definitionName: string; runId: string }) {
    setTypeName(run.definitionName)
    setSearch({ run: run.runId })
  }

  function handleSelectThread(thread: string | undefined) {
    setSearch({ run: runId, thread, seq: search.seq })
  }

  function handleSelectSeq(seq: number | undefined) {
    setSearch({ run: runId, thread: search.thread, seq })
  }

  function handleStarted(nextRunId: string) {
    setSearch({ run: nextRunId })
  }

  function handleReset() {
    setSearch({})
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar runId={runId} />
      <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1.1fr)_minmax(0,1.4fr)_18rem]">
        <section className="border-border bg-sidebar min-h-0 overflow-auto border-r">
          <div className="space-y-4 py-3">
            <RunTypes selected={typeName} onSelect={handleSelectType} />
            <Separator />
            {runId ? (
              <RunTree
                runId={runId}
                selectedThread={search.thread}
                onSelectThread={handleSelectThread}
              />
            ) : (
              <p className="text-muted-foreground px-2 text-xs">Start a run to see its tree.</p>
            )}
            <Separator />
            <RecentRuns selected={runId} onSelect={handleSelectRecentRun} />
          </div>
        </section>
        <section className="border-border min-h-0 overflow-hidden border-r">
          <ActiveWorkspace
            runId={runId}
            fallbackTypeName={typeName}
            onStarted={handleStarted}
            onReset={handleReset}
          />
        </section>
        <section className="border-border min-h-0 overflow-hidden border-r">
          {runId ? (
            <EventStream
              runId={runId}
              threadId={search.thread}
              selectedSeq={search.seq}
              onSelectSeq={handleSelectSeq}
            />
          ) : (
            <p className="text-muted-foreground p-3 text-xs">Events appear after a run starts.</p>
          )}
        </section>
        <section className="min-h-0 overflow-auto">
          {runId ? (
            <ProjectionsPanel runId={runId} />
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

function ActiveWorkspace({
  runId,
  fallbackTypeName,
  onStarted,
  onReset,
}: {
  runId?: string
  fallbackTypeName: string
  onStarted: (nextRunId: string) => void
  onReset: () => void
}) {
  if (!runId) {
    return (
      <WorkspacePanel
        type={findRunType(fallbackTypeName)}
        onStarted={onStarted}
        onReset={onReset}
      />
    )
  }

  return (
    <ActiveWorkspaceWithRun
      runId={runId}
      fallbackTypeName={fallbackTypeName}
      onStarted={onStarted}
      onReset={onReset}
    />
  )
}

function ActiveWorkspaceWithRun({
  runId,
  fallbackTypeName,
  onStarted,
  onReset,
}: {
  runId: string
  fallbackTypeName: string
  onStarted: (nextRunId: string) => void
  onReset: () => void
}) {
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const activeTypeName = summary.definitionName ?? fallbackTypeName
  const activeType = findRunType(activeTypeName)

  return <WorkspacePanel type={activeType} runId={runId} onStarted={onStarted} onReset={onReset} />
}
