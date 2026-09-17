import { loomsClient } from '@/lib/looms-client'
import { EventInspector as EventInspectorView } from '@swirls/looms/debugger'

import type { DemoEvents } from '../../runtime'

export function EventInspector({ event }: { runId: string; event: DemoEvents }) {
  return (
    <EventInspectorView
      event={event}
      loadReplayStep={({ runId, seq }) => loomsClient.replayTo(runId, seq).then((res) => res.step)}
    />
  )
}
