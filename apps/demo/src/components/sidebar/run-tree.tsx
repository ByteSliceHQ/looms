import { RunTree as RunTreeView } from '@looms/debugger'
import { useEventCounts, useRunStore, useRunSummary, useThreadTree } from '@looms/livestore/react'

export function RunTree({
  runId,
  selectedThread,
  onSelectThread,
}: {
  runId: string
  selectedThread?: string
  onSelectThread: (threadId: string | undefined) => void
}) {
  const store = useRunStore(runId)
  const tree = useThreadTree(store)
  const counts = useEventCounts(store)
  const summary = useRunSummary(store)

  return (
    <RunTreeView
      runId={runId}
      runStatus={summary.status}
      tree={tree}
      eventCounts={counts}
      totalEventCount={counts.get('run') ?? 0}
      selectedThread={selectedThread}
      onSelectThread={onSelectThread}
    />
  )
}
