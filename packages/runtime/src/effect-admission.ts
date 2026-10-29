import { Effect } from 'effect'

import {
  isPrimitiveEffect,
  readEffectFailure,
  type ComposedRegistry,
  type EffectAdmissionContext,
  type OutstandingEffect,
  type RuntimeEffect,
  type RunAttributes,
  type SecretContext,
  type TraceContext,
} from '@looms/core'

export type AdmissionDecision =
  | { readonly _tag: 'admit' }
  | {
      readonly _tag: 'reject'
      readonly error: string
      readonly nonRetryable: boolean
      readonly retryAfterMs?: number
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

  return Effect.forEach(
    registry.admission,
    (hook) => hook(effect, admissionCtx),
    { discard: true },
  ).pipe(
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
