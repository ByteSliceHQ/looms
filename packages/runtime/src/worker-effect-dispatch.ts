import { Effect, Predicate } from 'effect'

import {
  createEvent,
  isPrimitiveEffect,
  type ComposedRegistry,
  type EffectExecutionRecord,
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

const WORKER_ATTEMPT_STATUSES: ReadonlySet<EffectExecutionRecord['status']> = new Set([
  'queued',
  'dispatched',
  'started',
  'heartbeat',
  'cancel_requested',
  'timed_out',
  'ambiguous',
])

/**
 * Decides where an outstanding effect runs. An attempt already in flight keeps
 * its durable placement. Otherwise an explicit `execution` wins, then a worker
 * claim; effects with a local handler run in process and handler-less effects
 * go to the worker.
 */
export function isWorkerEffect(input: {
  readonly runId: string
  readonly item: OutstandingEffect
  readonly execution: EffectExecutionRecord | undefined
  readonly registry: ComposedRegistry
  readonly worker?: EffectWorker
}): boolean {
  const { item, execution, worker } = input

  if (isPrimitiveEffect(item.effect)) {
    return false
  }

  if (execution?.status === 'running') {
    return false
  }

  if (execution && WORKER_ATTEMPT_STATUSES.has(execution.status)) {
    return true
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
      const execution = input.state.effectExecutions[item.effectId]

      if (!isWorkerEffect({ ...input, item, execution })) {
        return false
      }

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

/**
 * Hand a planned attempt to the worker. A rejected dispatch may still have reached the worker, so
 * with a schedule-to-start deadline it is recorded as dispatched and recovered by that timeout;
 * without one it is parked as ambiguous for an operator.
 */
export function dispatchWorkerEffect(
  runId: string,
  plan: WorkerEffectDispatchPlan,
  worker: EffectWorker | undefined,
): Effect.Effect<EventEnvelope> {
  const dispatched = createEvent(runId, {
    type: 'runtime.effect.dispatched',
    payload: {
      effectId: plan.item.effectId,
      attempt: plan.attempt,
      deadlineAt: plan.scheduleToStartDeadlineAt,
    },
    threadId: plan.item.threadId,
    causationId: plan.item.causingEventId,
    origin: { type: 'system' },
  })

  const ambiguous = (error: string) =>
    createEvent(runId, {
      type: 'runtime.effect.ambiguous',
      payload: { effectId: plan.item.effectId, attempt: plan.attempt, error },
      threadId: plan.item.threadId,
      causationId: plan.item.causingEventId,
      origin: { type: 'system' },
    })

  if (!worker) {
    return Effect.succeed(
      ambiguous(`no effect worker is configured for "${plan.item.effect.type}"`),
    )
  }

  return Effect.tryPromise({
    try: () => Promise.resolve(worker.dispatch(plan.task)),
    catch: (cause) =>
      new RuntimeExecutionError(cause instanceof Error ? cause.message : String(cause)),
  }).pipe(
    Effect.match({
      onFailure: (error) =>
        plan.scheduleToStartDeadlineAt === null
          ? ambiguous(`worker dispatch outcome is ambiguous: ${error.message}`)
          : dispatched,
      onSuccess: () => dispatched,
    }),
  )
}
