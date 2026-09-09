import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { catalog, findRunType } from '../../catalog'
import { EventStream } from '../events/event-stream'
import { ProjectionsPanel } from '../projections/projections-panel'
import { RecentRuns } from '../sidebar/recent-runs'
import { RunTree } from '../sidebar/run-tree'
import { RunTypes } from '../sidebar/run-types'
import { Separator } from '../ui/separator'
import { TopBar } from './top-bar'
import { WorkspacePanel } from './workspace-panel'
import { useRun } from '@/hooks/use-run'

const route = getRouteApi('/')

export function Shell() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [typeName, setTypeName] = useState(catalog[0]!.name)
  const runId = search.run
  const activeType = findRunType(typeName)

  function setSearch(next: { run?: string; thread?: string; seq?: number }) {
    void navigate({
      to: '/',
      search: next,
    })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {runId ? <SyncType runId={runId} current={typeName} onName={setTypeName} /> : null}
      <TopBar runId={runId} />
      <div className="grid min-h-0 flex-1 grid-cols-[16rem_minmax(0,1.1fr)_minmax(0,1.4fr)_18rem]">
        <section className="min-h-0 overflow-auto border-r border-border bg-sidebar">
          <div className="space-y-4 py-3">
              <RunTypes
                selected={typeName}
                onSelect={(item) => {
                  setTypeName(item.name)
                  setSearch({})
                }}
              />
              <Separator />
              {runId ? (
                <RunTree
                  runId={runId}
                  selectedThread={search.thread}
                  onSelectThread={(thread) => setSearch({ run: runId, thread, seq: search.seq })}
                />
              ) : (
                <p className="px-2 text-xs text-muted-foreground">Start a run to see its tree.</p>
              )}
              <Separator />
              <RecentRuns
                selected={runId}
                onSelect={(run) => {
                  setTypeName(run.definitionName)
                  setSearch({ run: run.runId })
                }}
              />
            </div>
        </section>
        <section className="min-h-0 overflow-hidden border-r border-border">
          <WorkspacePanel
            type={activeType}
            runId={runId}
            onStarted={(nextRunId) => setSearch({ run: nextRunId })}
            onReset={() => setSearch({})}
          />
        </section>
        <section className="min-h-0 overflow-hidden border-r border-border">
          {runId ? (
            <EventStream
              runId={runId}
              threadId={search.thread}
              selectedSeq={search.seq}
              onSelectSeq={(seq) => setSearch({ run: runId, thread: search.thread, seq })}
            />
          ) : (
            <p className="p-3 text-xs text-muted-foreground">Events appear after a run starts.</p>
          )}
        </section>
        <section className="min-h-0 overflow-auto">
          {runId ? (
            <ProjectionsPanel runId={runId} />
          ) : (
            <p className="p-3 text-xs text-muted-foreground">Projections fold the same event log.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function SyncType({
  runId,
  current,
  onName,
}: {
  runId: string
  current: string
  onName: (name: string) => void
}) {
  const { definitionName } = useRun(runId)
  useEffect(() => {
    if (definitionName && definitionName !== current) onName(definitionName)
  }, [definitionName, current, onName])
  return null
}
