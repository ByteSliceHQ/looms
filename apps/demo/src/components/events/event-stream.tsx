import { useCallback } from 'react'

import { loomsClient } from '@/lib/looms-client'
import { EventStream as EventStreamView, type ReplayStep } from '@looms/debugger'
import { useRunEvents, useRunSelector, useRunStore } from '@looms/livestore/react'

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
    async ({ seq }: { seq: number }) => {
      const res = await loomsClient.replayTo(runId, seq)
      // SAFETY: host replay payload is ReplayStep | null.
      return res.step as ReplayStep | null
    },
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
