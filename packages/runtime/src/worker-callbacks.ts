import { Clock, Effect, Predicate } from 'effect'

import {
  createEvent,
  EventStoreTag,
  isRunTerminal,
  type ComposedRegistry,
  type EventEnvelope,
  type EventInput,
  type OutstandingEffect,
  type RetryPolicy,
  type RunState,
} from '@looms/core'

import { materializeEffectOutcome } from './helpers'
import type { RunIngress } from './ingress'
import { notifyObserver, type RuntimeObservation, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import { planAttemptFailure } from './retry-policy'
import type { LoomsRuntime, WorkerCallback } from './types'

const WORKER_ORIGIN = { type: 'external', actorId: 'worker' } as const

/** The earliest of the start-to-close cap and the next heartbeat deadline. */
function workerDeadline(
  retry: RetryPolicy | undefined,
  startedAt: number,
  now: number,
): number | null {
  const deadlines = [
    retry?.startToCloseTimeoutMs ? startedAt + retry.startToCloseTimeoutMs : null,
    retry?.heartbeatTimeoutMs ? now + retry.heartbeatTimeoutMs : null,
  ].filter(Predicate.isNotNull)

  return deadlines.length > 0 ? Math.min(...deadlines) : null
}

function workerStartedEvent(
  runId: string,
  item: OutstandingEffect,
  attempt: number,
  retry: RetryPolicy | undefined,
  now: number,
): EventEnvelope {
  return createEvent(runId, {
    type: 'runtime.effect.worker.started',
    payload: { effectId: item.effectId, attempt, deadlineAt: workerDeadline(retry, now, now) },
    threadId: item.threadId,
    origin: WORKER_ORIGIN,
  })
}

export interface WorkerCallbacksOptions {
  readonly registry: ComposedRegistry
  readonly repository: RuntimeRepository
  readonly withRunIngress: RunIngress
  readonly observer?: RuntimeObserver
  readonly wake: LoomsRuntime['wake']
}

type AppliedWorkerCallback =
  | (WorkerCallback & { kind: 'started' | 'heartbeat' | 'cancelled' })
  | (WorkerCallback & { kind: 'complete'; events: ReadonlyArray<EventInput> })
  | (WorkerCallback & { kind: 'fail'; error: string })

interface WorkerCallbackPlan {
  readonly events: ReadonlyArray<EventEnvelope>
  readonly notices: ReadonlyArray<RuntimeObservation>
}

const IGNORED: WorkerCallbackPlan = { events: [], notices: [] }

/**
 * Turn a worker callback into events against the current durable state. Callbacks for another
 * attempt, a settled attempt, or an effect running in process are ignored.
 */
function planWorkerCallback(input: {
  readonly runId: string
  readonly state: RunState
  readonly callback: AppliedWorkerCallback
  readonly registry: ComposedRegistry
  readonly now: number
}): Effect.Effect<WorkerCallbackPlan> {
  const { runId, state, callback, registry, now } = input
  const execution = state.effectExecutions[callback.effectId]

  const item = state.outstandingEffects.find(
    (candidate) => candidate.effectId === callback.effectId,
  )

  const isCancellationAcknowledgement =
    callback.kind === 'cancelled' &&
    execution?.attempt === callback.attempt &&
    execution.status === 'cancel_requested'

  if (
    !execution ||
    execution.attempt !== callback.attempt ||
    (isRunTerminal(state) && !isCancellationAcknowledgement) ||
    (!item && !isCancellationAcknowledgement) ||
    execution.status === 'running' ||
    execution.status === 'retry_wait' ||
    execution.status === 'timed_out' ||
    execution.status === 'ambiguous' ||
    (callback.kind === 'cancelled' && !isCancellationAcknowledgement) ||
    (execution.status === 'cancel_requested' && callback.kind !== 'cancelled')
  ) {
    return Effect.succeed(IGNORED)
  }

  const retry = item ? registry.effects.get(item.effect.type)?.retry : undefined

  const notice = (type: 'effect.heartbeat' | 'effect.cancellation'): RuntimeObservation => ({
    type,
    runId,
    at: now,
    effectId: callback.effectId,
    attempt: callback.attempt,
  })

  switch (callback.kind) {
    case 'started': {
      return Effect.succeed(
        item && execution.status === 'dispatched'
          ? { events: [workerStartedEvent(runId, item, callback.attempt, retry, now)], notices: [] }
          : IGNORED,
      )
    }

    case 'heartbeat': {
      const implicitStart = execution.status === 'dispatched'

      if (
        !item ||
        (!implicitStart && execution.status !== 'started' && execution.status !== 'heartbeat')
      ) {
        return Effect.succeed(IGNORED)
      }

      return Effect.succeed({
        events: [
          ...(implicitStart ? [workerStartedEvent(runId, item, callback.attempt, retry, now)] : []),
          createEvent(runId, {
            type: 'runtime.effect.heartbeat',
            payload: {
              effectId: item.effectId,
              attempt: callback.attempt,
              heartbeatAt: now,
              deadlineAt: workerDeadline(retry, execution.startedAt ?? now, now),
            },
            threadId: item.threadId,
            origin: WORKER_ORIGIN,
          }),
        ],
        notices: [notice('effect.heartbeat')],
      })
    }

    case 'complete': {
      if (!item) {
        return Effect.succeed(IGNORED)
      }

      return Effect.forEach(callback.events, (event) =>
        materializeEffectOutcome(registry.catalogs, runId, item, event),
      ).pipe(
        Effect.map((outcomes) => ({
          events: [
            ...outcomes,
            createEvent(runId, {
              type: 'runtime.effect.completed',
              payload: { effectId: item.effectId, attempt: callback.attempt },
              threadId: item.threadId,
              effectId: item.effectId,
              causationId: item.causingEventId,
              origin: WORKER_ORIGIN,
            }),
          ],
          notices: [],
        })),
      )
    }

    case 'fail': {
      if (!item) {
        return Effect.succeed(IGNORED)
      }

      const failure = planAttemptFailure({
        runId,
        item,
        attempt: callback.attempt,
        error: callback.error,
        now,
        retry,
        origin: WORKER_ORIGIN,
      })

      return Effect.succeed({
        events: [failure.event],
        notices: failure.retrying
          ? [
              {
                type: 'effect.retry',
                runId,
                at: now,
                effectId: item.effectId,
                attempt: callback.attempt,
                detail: callback.error,
              },
            ]
          : [],
      })
    }

    case 'cancelled': {
      return Effect.succeed({
        events: [
          createEvent(runId, {
            type: 'runtime.effect.cancelled',
            payload: { effectId: callback.effectId, attempt: callback.attempt },
            threadId: item?.threadId ?? null,
            effectId: callback.effectId,
            origin: WORKER_ORIGIN,
          }),
        ],
        notices: [notice('effect.cancellation')],
      })
    }

    default: {
      const exhaustiveCheck: never = callback
      return exhaustiveCheck
    }
  }
}

export function createWorkerCallbacks(options: WorkerCallbacksOptions) {
  const { registry, repository, withRunIngress } = options

  const applyWorkerCallback = (runId: string, callback: AppliedWorkerCallback) =>
    withRunIngress(
      runId,
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const now = yield* Clock.currentTimeMillis

        const committed = yield* repository.commit(store, runId, (cursor) =>
          planWorkerCallback({ runId, state: cursor.state, callback, registry, now }).pipe(
            Effect.map((plan) => ({ events: plan.events, value: plan.notices })),
          ),
        )

        if (committed.append) {
          for (const notice of committed.value) {
            notifyObserver(options.observer, notice)
          }
        }

        return committed.cursor.state
      }),
    ).pipe(Effect.andThen(options.wake(runId)))

  return {
    workerStarted: (runId: string, callback: WorkerCallback) =>
      applyWorkerCallback(runId, { ...callback, kind: 'started' }),
    workerHeartbeat: (runId: string, callback: WorkerCallback) =>
      applyWorkerCallback(runId, { ...callback, kind: 'heartbeat' }),
    workerComplete: (
      runId: string,
      callback: WorkerCallback & { events: ReadonlyArray<EventInput> },
    ) => applyWorkerCallback(runId, { ...callback, kind: 'complete' }),
    workerFail: (runId: string, callback: WorkerCallback & { error: string }) =>
      applyWorkerCallback(runId, { ...callback, kind: 'fail' }),
    workerCancelled: (runId: string, callback: WorkerCallback) =>
      applyWorkerCallback(runId, { ...callback, kind: 'cancelled' }),
  }
}
