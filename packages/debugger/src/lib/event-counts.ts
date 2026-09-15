import { EventIndex, isJsonObject, isJsonString, type EventEnvelope } from '@looms/core'

/** Build thread→count map via the shared EventIndex. */
export function countEventsByThread(events: readonly EventEnvelope[]): Map<string, number> {
  const index = new EventIndex()
  index.append(events)
  return new Map(index.getCounts())
}

export function runStatusFromEvents(events: readonly EventEnvelope[]): string {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]

    if (!event || event.type !== 'runtime.run.completed') {
      continue
    }

    const payload = isJsonObject(event.payload) ? event.payload : {}
    return isJsonString(payload.error) && payload.error.length > 0 ? 'failed' : 'completed'
  }

  return 'running'
}

export function startedAtFromEvents(events: readonly EventEnvelope[]): number | undefined {
  const index = new EventIndex()
  index.append(events)
  return index.getStartedAt()
}
