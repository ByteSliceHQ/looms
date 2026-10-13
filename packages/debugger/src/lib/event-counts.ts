import { completedRunStatus, EventIndex, type EventEnvelope, type RunStatus } from '@looms/core'

/** Build thread→count map via the shared EventIndex. */
export function countEventsByThread(events: readonly EventEnvelope[]): Map<string, number> {
  const index = new EventIndex()
  index.append(events)
  return new Map(index.getCounts())
}

export function runStatusFromEvents(events: readonly EventEnvelope[]): RunStatus {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]

    if (event?.type === 'runtime.run.cancelled') {
      return 'cancelled'
    }

    if (event?.type === 'runtime.run.completed') {
      return completedRunStatus(event.payload)
    }
  }

  return 'running'
}

export function startedAtFromEvents(events: readonly EventEnvelope[]): number | undefined {
  const index = new EventIndex()
  index.append(events)
  return index.getStartedAt()
}
