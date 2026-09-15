import { useRun } from '@/hooks/use-run'
import { RunTree as RunTreeView } from '@looms/debugger'

export function RunTree({
  runId,
  selectedThread,
  onSelectThread,
}: {
  runId: string
  selectedThread?: string
  onSelectThread: (threadId: string | undefined) => void
}) {
  const { tree, status, counts, events } = useRun(runId)
  return (
    <RunTreeView
      runId={runId}
      runStatus={status}
      tree={tree}
      eventCounts={counts}
      totalEventCount={counts.get('run') ?? events.length}
      selectedThread={selectedThread}
      onSelectThread={onSelectThread}
    />
  )
}
