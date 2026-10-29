import {
  createEvent,
  type EventEnvelope,
  type EventOrigin,
  type OutstandingEffect,
  type RetryPolicy,
} from '@looms/core'

import { createEffectFailedEvent } from './helpers'

export function retryBackoff(retry: RetryPolicy, attempt: number): number {
  const base = Math.max(1, retry.backoffMs ?? 100)
  const multiplier = Math.max(1, retry.backoffMultiplier ?? 2)

  return Math.min(
    base * multiplier ** Math.max(0, attempt - 1),
    retry.maxBackoffMs ?? Number.MAX_SAFE_INTEGER,
  )
}

/** Policy backoff, extended when the failed attempt asked to wait longer. */
export function retryDelay(retry: RetryPolicy, attempt: number, retryAfterMs?: number): number {
  const backoff = retryBackoff(retry, attempt)

  if (retryAfterMs === undefined || !Number.isFinite(retryAfterMs) || retryAfterMs < 0) {
    return backoff
  }

  return Math.max(backoff, retryAfterMs)
}

export interface AttemptFailurePlan {
  readonly event: EventEnvelope
  readonly retrying: boolean
}

/** Schedule the next attempt when the retry policy allows one, otherwise fail the effect. */
export function planAttemptFailure(input: {
  readonly runId: string
  readonly item: OutstandingEffect
  readonly attempt: number
  readonly error: string
  readonly now: number
  readonly retry: RetryPolicy | undefined
  readonly origin: EventOrigin
  /** Customer/domain failures must not be retried even when attempts remain. */
  readonly nonRetryable?: boolean
  readonly retryAfterMs?: number
}): AttemptFailurePlan {
  const { runId, item, attempt, error, retry } = input

  if (input.nonRetryable || !retry || attempt >= retry.maxAttempts) {
    return {
      event: createEffectFailedEvent(runId, item, error, {
        nonRetryable: input.nonRetryable === true,
      }),
      retrying: false,
    }
  }

  return {
    retrying: true,
    event: createEvent(runId, {
      type: 'runtime.effect.retry.scheduled',
      payload: {
        effectId: item.effectId,
        attempt,
        nextAttemptAt: input.now + retryDelay(retry, attempt, input.retryAfterMs),
        error,
      },
      threadId: item.threadId,
      causationId: item.causingEventId,
      origin: input.origin,
    }),
  }
}
