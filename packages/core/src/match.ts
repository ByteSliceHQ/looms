import { Predicate } from 'effect'
import type { EventEnvelope } from './envelope'
import { isWaitOnEvent, isWaitOnTimer, type WaitCondition } from './effects'
import type { JsonValue } from './types'

export function isSubset(match: JsonValue, payload: JsonValue): boolean {
  if (match === payload) return true
  if (Array.isArray(match)) {
    if (!Array.isArray(payload)) return false
    if (match.length !== payload.length) return false
    return match.every((item, index) => isSubset(item, payload[index] ?? null))
  }
  if (Predicate.isReadonlyObject(match)) {
    if (!Predicate.isObject(payload)) return false
    for (const key of Object.keys(match)) {
      const expected = match[key]
      if (expected === undefined) continue
      if (!(key in payload)) return false
      const actual = payload[key]
      if (actual === undefined) return false
      if (!isSubset(expected, actual)) return false
    }
    return true
  }
  return false
}

export function matchesWait(event: EventEnvelope, on: WaitCondition): boolean {
  if (isWaitOnTimer(on)) {
    return event.type === 'runtime.timer.fired'
  }
  if (!isWaitOnEvent(on)) return false
  if (event.type !== on.type) return false
  if (on.match === undefined) return true
  return isSubset(on.match, event.payload)
}

export function matchingWaits<T extends { on: WaitCondition }>(
  event: EventEnvelope,
  waits: readonly T[],
): T[] {
  return waits.filter((record) => matchesWait(event, record.on))
}
