import type { EventEnvelope } from './envelope'
import type { RuntimeEffect } from './effects'
import { foldEvent, foldRun, type FoldRegistry } from './fold'
import { emptyRunState, type RunState } from './state'

export interface ReplayStep {
  seq: number
  event: EventEnvelope
  before: RunState
  after: RunState
  effects: RuntimeEffect[]
}

export function replayTo(
  events: readonly EventEnvelope[],
  registry: FoldRegistry,
  seq: number,
): ReplayStep | null {
  const target = events.find((event) => event.seq === seq && !event.ephemeral)
  if (!target) return null
  const prior = events.filter((event) => event.seq < seq)
  const before = foldRun(prior, registry, { runId: target.runId })
  const after = foldEvent(before, target, registry)
  const beforeIds = new Set(before.outstandingEffects.map((item) => item.effectId))
  const effects = after.outstandingEffects
    .filter((item) => !beforeIds.has(item.effectId))
    .map((item) => item.effect)
  return { seq, event: target, before, after, effects }
}

export function replayAll(events: readonly EventEnvelope[], registry: FoldRegistry): ReplayStep[] {
  const steps: ReplayStep[] = []
  let state = emptyRunState(events[0]?.runId ?? 'unknown')
  for (const event of events) {
    if (event.ephemeral) continue
    const before = state
    const after = foldEvent(before, event, registry)
    const beforeIds = new Set(before.outstandingEffects.map((item) => item.effectId))
    const effects = after.outstandingEffects
      .filter((item) => !beforeIds.has(item.effectId))
      .map((item) => item.effect)
    steps.push({ seq: event.seq, event, before, after, effects })
    state = after
  }
  return steps
}
