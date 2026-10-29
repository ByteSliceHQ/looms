import { Effect } from 'effect'

import {
  isPrimitiveEffect,
  readEffectFailure,
  type ComposedRegistry,
  type EffectAdmissionContext,
  type EventEnvelope,
  type OutstandingEffect,
  type RetryPolicy,
  type RuntimeEffect,
  type RunAttributes,
  type SecretContext,
  type TraceContext,
} from '@looms/core'

import type { RuntimeObservation } from './observer'
import { planAttemptFailure } from './retry-policy'

export type AdmissionDecision =
  | { readonly _tag: 'admit' }
  | {
      readonly _tag: 'reject'
      readonly error: string
      readonly nonRetryable: boolean
      readonly retryAfterMs?: number
    }

export type AdmitOrFailResult =
  | { readonly _tag: 'admit' }
  | {
      readonly _tag: 'reject'
      readonly event: EventEnvelope
      readonly retrying: boolean
      /** Present when the reject schedules another attempt under the retry policy. */
      readonly observation?: RuntimeObservation
    }

/**
 * Run every composed admission hook before a local attempt or a worker dispatch.
 * A `failEffect` (or other thrown/failed cause) becomes a reject decision.
 */
export function runEffectAdmission(
  registry: ComposedRegistry,
  item: OutstandingEffect,
  context: {
    readonly runId: string
    readonly attributes: RunAttributes
    readonly secrets: SecretContext
    readonly trace: TraceContext | null
  },
): Effect.Effect<AdmissionDecision> {
  if (isPrimitiveEffect(item.effect) || registry.admission.length === 0) {
    return Effect.succeed({ _tag: 'admit' })
  }

  const admissionCtx: EffectAdmissionContext = {
    effectId: item.effectId,
    runId: context.runId,
    threadId: item.threadId,
    causingEventId: item.causingEventId,
    attributes: context.attributes,
    secrets: context.secrets,
    trace: context.trace,
  }

  const effect: RuntimeEffect = item.effect

  return Effect.forEach(registry.admission, (hook) => hook(effect, admissionCtx), {
    discard: true,
  }).pipe(
    Effect.as({ _tag: 'admit' } as const),
    Effect.catch((cause) => {
      const failure = readEffectFailure(cause)

      return Effect.succeed({
        _tag: 'reject' as const,
        error: failure?.error ?? (cause instanceof Error ? cause.message : String(cause)),
        nonRetryable: failure?.nonRetryable === true,
        retryAfterMs: failure?.retryAfterMs,
      })
    }),
  )
}

/**
 * Gate an attempt, then turn a reject into the durable failure/retry event both the local
 * executor and the wake engine append. Call sites only append the event (and notify observer).
 */
export function admitOrFailAttempt(input: {
  readonly registry: ComposedRegistry
  readonly item: OutstandingEffect
  readonly runId: string
  readonly attempt: number
  readonly now: number
  readonly attributes: RunAttributes
  readonly secrets: SecretContext
  readonly trace: TraceContext | null
  readonly retry: RetryPolicy | undefined
}): Effect.Effect<AdmitOrFailResult> {
  return runEffectAdmission(input.registry, input.item, input).pipe(
    Effect.map((decision) => {
      if (decision._tag === 'admit') {
        return { _tag: 'admit' } as const
      }

      const failure = planAttemptFailure({
        runId: input.runId,
        item: input.item,
        attempt: input.attempt,
        error: decision.error,
        now: input.now,
        retry: input.retry,
        origin: { type: 'system' },
        nonRetryable: decision.nonRetryable,
        retryAfterMs: decision.retryAfterMs,
      })

      return {
        _tag: 'reject' as const,
        event: failure.event,
        retrying: failure.retrying,
        observation: failure.retrying
          ? {
              type: 'effect.retry' as const,
              runId: input.runId,
              at: input.now,
              effectId: input.item.effectId,
              attempt: input.attempt,
              detail: decision.error,
            }
          : undefined,
      }
    }),
  )
}
