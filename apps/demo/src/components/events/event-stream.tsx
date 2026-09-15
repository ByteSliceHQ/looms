import { useRun } from '@/hooks/use-run'
import { loomsClient } from '@/lib/looms-client'
import { EventStream as EventStreamView, type ReplayStep } from '@looms/debugger'

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
  const { events, startedAt } = useRun(runId)

  return (
    <EventStreamView
      events={events}
      startedAt={startedAt}
      threadId={threadId}
      selectedSeq={selectedSeq}
      onSelectSeq={onSelectSeq}
      catalog={demoEventCatalog}
      loadReplayStep={async ({ seq }) => {
        const res = await loomsClient.replayTo(runId, seq)
        // SAFETY: host replay payload is ReplayStep | null.
        return res.step as ReplayStep | null
      }}
    />
  )
}
