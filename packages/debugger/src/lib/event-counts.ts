import { completedRunStatus, EventIndex, type EventEnvelope, type RunStatus } from '@looms/core'

/** Build thread→count map via the shared EventIndex. */
export function countEventsByThread(events: readonly EventEnvelope[]): Map<string, number> {
  const index = new EventIndex()
  index.append(events)
  return new Map(index.getCounts())
}

export function runStatusFromEvents(events: readonly EventEnvelope[]): RunStatus {
  const ended = events.findLast(
    (event) => event.type === 'runtime.run.cancelled' || event.type === 'runtime.run.completed',
  )

  if (!ended) {
    return 'running'
  }

  return ended.type === 'runtime.run.cancelled' ? 'cancelled' : completedRunStatus(ended.payload)
}

export function startedAtFromEvents(events: readonly EventEnvelope[]): number | undefined {
  const index = new EventIndex()
  index.append(events)
  return index.getStartedAt()
}
