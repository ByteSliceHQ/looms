import { isJsonObject, isJsonString, type EventEnvelope } from '@looms/core'

export function countEventsByThread(events: readonly EventEnvelope[]): Map<string, number> {
  const map = new Map<string, number>()

  for (const event of events) {
    const key = event.threadId ?? 'run'
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  return map
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

  return events.length > 0 ? 'running' : 'running'
}

export function startedAtFromEvents(events: readonly EventEnvelope[]): number | undefined {
  return events.find((event) => event.type === 'runtime.run.started')?.ts
}
