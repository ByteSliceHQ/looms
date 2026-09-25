import { useCallback, useMemo } from 'react'

import {
  useEventCounts,
  useRunEvents,
  useRunStore,
  useRunSummary,
  useThreadTree,
} from '@looms/react'

import { findThreadName } from '../components/debugger-split'
import { EventStream } from '../components/event-stream'
import { RunTree } from '../components/run-tree'
import { useDebugger } from '../context'
import type { ReplayLoader } from '../contracts'
import { createEventCatalog } from '../events/catalog'

export function EventsPane({
  runId,
  threadId,
  seq,
  onSelectSeq,
  onClearThread,
}: {
  runId: string
  threadId?: string
  seq?: number
  onSelectSeq: (seq: number | undefined) => void
  onClearThread: () => void
}) {
  const { client, plugins } = useDebugger()
  const catalog = useMemo(() => createEventCatalog(plugins), [plugins])
  const store = useRunStore(runId)
  const events = useRunEvents(store)
  const summary = useRunSummary(store)
  const tree = useThreadTree(store)

  const loadReplayStep = useCallback<ReplayLoader>(
    ({ runId: replayRunId, seq: replaySeq }) =>
      client.replayTo(replayRunId, replaySeq).then((result) => result.step),
    [client],
  )

  return (
    <EventStream
      events={events}
      startedAt={summary.startedAt}
      threadId={threadId}
      threadLabel={findThreadName(tree.root, threadId)}
      onClearThread={onClearThread}
      selectedSeq={seq}
      onSelectSeq={onSelectSeq}
      loadReplayStep={loadReplayStep}
      catalog={catalog}
    />
  )
}

export function RunTreePane({
  runId,
  threadId,
  onSelectThread,
}: {
  runId: string
  threadId?: string
  onSelectThread: (threadId: string | undefined) => void
}) {
  const store = useRunStore(runId)
  const summary = useRunSummary(store)
  const tree = useThreadTree(store)
  const counts = useEventCounts(store)

  return (
    <RunTree
      runId={runId}
      runStatus={summary.status}
      tree={tree}
      eventCounts={counts}
      selectedThread={threadId}
      onSelectThread={onSelectThread}
    />
  )
}
