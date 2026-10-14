import { Schema } from 'effect'

import { protocolCatalog, type ProtocolEventType } from './protocol'
import type { AnyEventEnvelope } from './register'

const RETRY_SCHEDULED: ProtocolEventType = 'runtime.effect.retry.scheduled'

const isRetryPayload = Schema.is(protocolCatalog.entries['effect.retry.scheduled'])

/** The effect a `runtime.effect.retry.scheduled` event retries, or `undefined` for other events. */
export function retriedEffectId(event: AnyEventEnvelope): string | undefined {
  return event.type === RETRY_SCHEDULED && isRetryPayload(event.payload)
    ? event.payload.effectId
    : undefined
}

/**
 * Drops ephemeral events from effect attempts that a later retry in `events` superseded. Durable
 * events and ephemeral events from the current attempt are kept.
 */
export function dropSupersededAttempts<E extends AnyEventEnvelope>(
  events: readonly E[],
): readonly E[] {
  const lastRetry = new Map<string, number>()

  events.forEach((event, index) => {
    const effectId = retriedEffectId(event)

    if (effectId !== undefined) {
      lastRetry.set(effectId, index)
    }
  })

  if (lastRetry.size === 0) {
    return events
  }

  return events.filter(
    (event, index) =>
      !event.ephemeral || !event.effectId || (lastRetry.get(event.effectId) ?? -1) < index,
  )
}
