import { useCallback } from 'react'

import { loomsClient } from '@/lib/looms-client'
import { EventStream as EventStreamView } from '@swirls/looms/debugger'
import { useRunEvents, useRunSelector, useRunStore } from '@swirls/looms/react'

import { demoEventCatalog } from './event-summary'

export function EventStream({
  runId,
  threadId,
  selectedSeq,
  onSelectSeq,
}: {
  runId: string
  threadId?: string
  selectedSeq?: number
  onSelectSeq: (seq: number | undefined) => void
}) {
  const store = useRunStore(runId)
  const events = useRunEvents(store)

  const startedAt = useRunSelector(
    store,
    useCallback((s) => s.query.startedAt(), []),
  )

  const handleLoadReplayStep = useCallback(
    ({ seq }: { seq: number }) => loomsClient.replayTo(runId, seq).then((res) => res.step),
    [runId],
  )

  return (
    <EventStreamView
      events={events}
      startedAt={startedAt}
      threadId={threadId}
      selectedSeq={selectedSeq}
      onSelectSeq={onSelectSeq}
      catalog={demoEventCatalog}
      loadReplayStep={handleLoadReplayStep}
    />
  )
}
