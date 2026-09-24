import { Effect, Predicate } from 'effect'

import {
  createEvent,
  isPrimitiveEffect,
  type ComposedRegistry,
  type EventEnvelope,
  type OutstandingEffect,
  type RunState,
} from '@looms/core'

import { RuntimeExecutionError } from './errors'
import { workerTask } from './helpers'
import type { EffectWorker, EffectWorkerTask } from './types'

export interface WorkerEffectDispatchPlan {
  readonly item: OutstandingEffect
  readonly attempt: number
  readonly queuedEvent?: EventEnvelope
  readonly task: EffectWorkerTask
  readonly scheduleToStartDeadlineAt: number | null
}

function workerClaims(
  worker: EffectWorker,
  runId: string,
  item: OutstandingEffect,
): boolean | undefined {
  if (!worker.handles && !worker.canDispatch) {
    return undefined
  }

  const { handles } = worker

  const handled = Predicate.isFunction(handles)
    ? handles(item.effect.type)
    : (handles?.includes(item.effect.type) ?? false)

  return handled || (worker.canDispatch?.(workerTask(runId, item, 0)) ?? false)
}

/**
 * Decides where an outstanding effect runs. An explicit `execution` wins, then
 * a worker claim; otherwise effects with a local handler run in process and
 * handler-less effects go to the worker.
 */
export function isWorkerEffect(input: {
  readonly runId: string
  readonly item: OutstandingEffect
  readonly registry: ComposedRegistry
  readonly worker?: EffectWorker
}): boolean {
  const { item, worker } = input

  if (isPrimitiveEffect(item.effect)) {
    return false
  }

  const definition = input.registry.effects.get(item.effect.type)

  if (definition?.execution) {
    return definition.execution === 'worker'
  }

  const claim = worker ? workerClaims(worker, input.runId, item) : undefined

  if (claim) {
    return true
  }

  if (definition) {
    return !definition.hasHandler
  }

  return worker !== undefined && claim !== false
}

export function planWorkerEffects(input: {
  readonly runId: string
  readonly state: RunState
  readonly registry: ComposedRegistry
  readonly worker?: EffectWorker
  readonly now: number
}): ReadonlyArray<WorkerEffectDispatchPlan> {
  return input.state.outstandingEffects
    .filter((item) => {
      if (!isWorkerEffect({ ...input, item })) {
        return false
      }

      const execution = input.state.effectExecutions[item.effectId]
      return (
        !execution ||
        execution.status === 'queued' ||
        (execution.status === 'retry_wait' &&
          execution.nextAttemptAt !== null &&
          execution.nextAttemptAt <= input.now + 5)
      )
    })
    .map((item) => {
      const existing = input.state.effectExecutions[item.effectId]

      const attempt =
        existing?.status === 'queued' ? existing.attempt : (existing?.attempt ?? 0) + 1

      const retry = input.registry.effects.get(item.effect.type)?.retry

      return {
        item,
        attempt,
        queuedEvent:
          existing?.status === 'queued'
            ? undefined
            : createEvent(input.runId, {
                type: 'runtime.effect.queued',
                payload: { effectId: item.effectId, attempt, deadlineAt: null },
                threadId: item.threadId,
                causationId: item.causingEventId,
                origin: { type: 'system' },
              }),
        task: workerTask(input.runId, item, attempt),
        scheduleToStartDeadlineAt: retry?.scheduleToStartTimeoutMs
          ? input.now + retry.scheduleToStartTimeoutMs
          : null,
      }
    })
}

export function dispatchWorkerEffect(
  runId: string,
  plan: WorkerEffectDispatchPlan,
  worker: EffectWorker | undefined,
): Effect.Effect<EventEnvelope> {
  return Effect.tryPromise({
    try: () =>
      worker
        ? Promise.resolve(worker.dispatch(plan.task)).then(() => undefined)
        : Promise.reject(new RuntimeExecutionError('No effect worker dispatcher configured')),
    catch: (cause) =>
      new RuntimeExecutionError(cause instanceof Error ? cause.message : String(cause)),
  }).pipe(
    Effect.match({
      onFailure: () =>
        createEvent(runId, {
          type: 'runtime.effect.ambiguous',
          payload: {
            effectId: plan.item.effectId,
            attempt: plan.attempt,
            error: 'worker dispatch outcome is ambiguous',
          },
          threadId: plan.item.threadId,
          causationId: plan.item.causingEventId,
          origin: { type: 'system' },
        }),
      onSuccess: () =>
        createEvent(runId, {
          type: 'runtime.effect.dispatched',
          payload: {
            effectId: plan.item.effectId,
            attempt: plan.attempt,
            deadlineAt: plan.scheduleToStartDeadlineAt,
          },
          threadId: plan.item.threadId,
          causationId: plan.item.causingEventId,
          origin: { type: 'system' },
        }),
    }),
  )
}
