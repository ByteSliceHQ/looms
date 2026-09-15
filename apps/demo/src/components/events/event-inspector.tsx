import { loomsClient } from '@/lib/looms-client'
import { EventInspector as EventInspectorView, type ReplayStep } from '@looms/debugger'

import type { DemoEvents } from '../../runtime'

export function EventInspector({ event }: { runId: string; event: DemoEvents }) {
  return (
    <EventInspectorView
      event={event}
      loadReplayStep={async ({ runId, seq }) => {
        const res = await loomsClient.replayTo(runId, seq)
        // SAFETY: host replay payload is ReplayStep | null.
        return res.step as ReplayStep | null
      }}
    />
  )
}
