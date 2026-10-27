import { Effect, Predicate } from 'effect'

import {
  createEvent,
  deferredUntil,
  isPrimitiveEffect,
  type ComposedRegistry,
  type EffectDefinition,
  type EffectExecutionRecord,
  type EventEnvelope,
  type OutstandingEffect,
  type RetryPolicy,
  type RunState,
  type SecretContext,
} from '@looms/core'

import { RuntimeExecutionError } from './errors'
import { workerTask } from './helpers'
import { planAttemptFailure } from './retry-policy'
import type { EffectWorker, EffectWorkerTask } from './types'

export interface WorkerEffectDispatchPlan {
  readonly item: OutstandingEffect
  readonly attempt: number
  readonly queuedEvent?: EventEnvelope
  readonly task: EffectWorkerTask
  readonly retry: RetryPolicy | undefined
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
  readonly maxInFlightWorkerEffects?: number
  readonly secrets?: SecretContext
}): ReadonlyArray<WorkerEffectDispatchPlan> {
  const workerItems = input.state.outstandingEffects.filter((item) =>
    isWorkerEffect({ ...input, item, execution: input.state.effectExecutions[item.effectId] }),
  )

  const due = workerItems.filter((item) => {
    const dueAt = deferredUntil(item.effect)

    if (dueAt !== undefined && dueAt > input.now + 5) {
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

  return withinInFlightLimit(input, workerItems, due).map((item) => {
    const existing = input.state.effectExecutions[item.effectId]

    const attempt = existing?.status === 'queued' ? existing.attempt : (existing?.attempt ?? 0) + 1

    const retry = input.registry.effects.get(item.effect.type)?.retry

    const scheduleToStartDeadlineAt = retry?.scheduleToStartTimeoutMs
      ? input.now + retry.scheduleToStartTimeoutMs
      : null

    return {
      item,
      attempt,
      retry,
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
      task: workerTask(input.runId, item, attempt, {
        details: existing?.heartbeatDetails,
        secrets: input.secrets,
        trace: input.state.startIdentity?.trace,
        retry,
        scheduleToStartAt: scheduleToStartDeadlineAt,
      }),
      scheduleToStartDeadlineAt,
    }
  })
}

const IN_FLIGHT_STATUSES: ReadonlySet<string> = new Set([
  'dispatched',
  'started',
  'heartbeat',
  'cancel_requested',
])

function withinInFlightLimit(
  input: { readonly state: RunState; readonly maxInFlightWorkerEffects?: number },
  workerItems: ReadonlyArray<OutstandingEffect>,
  due: ReadonlyArray<OutstandingEffect>,
): ReadonlyArray<OutstandingEffect> {
  const max = input.maxInFlightWorkerEffects

  if (max === undefined || max <= 0) {
    return due
  }

  const inFlight = workerItems.filter((item) => {
    const status = input.state.effectExecutions[item.effectId]?.status

    return status !== undefined && IN_FLIGHT_STATUSES.has(status)
  }).length

  return due.slice(0, Math.max(0, max - inFlight))
}

/**
 * Hand a planned attempt to the worker. When an unacknowledged dispatch rejects, the task may still
 * have reached the worker, so with a schedule-to-start deadline it is recorded as dispatched and
 * recovered by that timeout; without one it is parked as ambiguous for an operator. An acknowledged
 * rejection means nothing was sent, so the attempt fails under the retry policy.
 */
export function dispatchWorkerEffect(
  runId: string,
  plan: WorkerEffectDispatchPlan,
  worker: EffectWorker | undefined,
  now: number,
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
      onFailure: (error) => {
        if (worker.dispatchSemantics === 'acknowledged') {
          return planAttemptFailure({
            runId,
            item: plan.item,
            attempt: plan.attempt,
            error: `worker dispatch failed: ${error.message}`,
            now,
            retry: plan.retry,
            origin: { type: 'system' },
          }).event
        }

        return plan.scheduleToStartDeadlineAt === null
          ? ambiguous(`worker dispatch outcome is ambiguous: ${error.message}`)
          : dispatched
      },
      onSuccess: () => dispatched,
    }),
  )
}

/**
 * An acknowledged transport can lose a message it accepted, for example to a dead-letter queue.
 * schedule-to-start covers a message that never starts. After `started` is acked, only
 * start-to-close or a heartbeat timeout notices a lost terminal callback, so every claimed
 * effect needs one of those as well.
 */
export function assertWorkerDeadlines(
  registry: ComposedRegistry,
  worker: EffectWorker | undefined,
): void {
  if (worker?.dispatchSemantics !== 'acknowledged') {
    return
  }

  const claimed = [...registry.effects.values()].filter((definition) =>
    claimsType(worker, definition),
  )

  const missingStart = claimed
    .filter((definition) => !definition.retry?.scheduleToStartTimeoutMs)
    .map((definition) => definition.type)

  if (missingStart.length > 0) {
    throw new Error(
      `An acknowledged worker claims effects without retry.scheduleToStartTimeoutMs: ${missingStart.join(', ')}`,
    )
  }

  const missingClose = claimed
    .filter(
      (definition) =>
        !definition.retry?.startToCloseTimeoutMs && !definition.retry?.heartbeatTimeoutMs,
    )
    .map((definition) => definition.type)

  if (missingClose.length > 0) {
    throw new Error(
      `An acknowledged worker claims effects without retry.startToCloseTimeoutMs or retry.heartbeatTimeoutMs: ${missingClose.join(', ')}`,
    )
  }
}

function claimsType(worker: EffectWorker, definition: EffectDefinition): boolean {
  if (definition.execution) {
    return definition.execution === 'worker'
  }

  const { handles } = worker

  const handled = Predicate.isFunction(handles)
    ? handles(definition.type)
    : (handles?.includes(definition.type) ?? false)

  return handled || !definition.hasHandler
}
