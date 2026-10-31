import { Clock, Effect, Predicate } from 'effect'

import {
  createEvent,
  EventStoreTag,
  foldRun,
  isRunTerminal,
  type ComposedRegistry,
  type EventEnvelope,
  type OutstandingEffect,
  type RetryPolicy,
  type RunState,
  type WorkerCallback,
  type WorkerCallbackInput,
  type WorkerSecretsResult,
  type WorkerCallbackResult,
} from '@looms/core'

import { materializeEffectOutcome, waitSatisfiedEvents } from './helpers'
import type { RunIngress } from './ingress'
import { notifyObserver, type RuntimeObservation, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import { planAttemptFailure } from './retry-policy'
import type { LoomsRuntime } from './types'

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

interface WorkerCallbackPlan {
  readonly events: ReadonlyArray<EventEnvelope>
  readonly notices: ReadonlyArray<RuntimeObservation>
  readonly result: WorkerCallbackResult
}

const STALE: WorkerCallbackPlan = {
  events: [],
  notices: [],
  result: { status: 'stale', cancelRequested: false },
}

const CANCELLED: WorkerCallbackPlan = {
  events: [],
  notices: [],
  result: { status: 'cancelled', cancelRequested: true },
}

function accepted(
  events: ReadonlyArray<EventEnvelope>,
  notices: ReadonlyArray<RuntimeObservation> = [],
  cancelRequested = false,
): WorkerCallbackPlan {
  return { events, notices, result: { status: 'accepted', cancelRequested } }
}

/**
 * Turn a worker callback into events against the current durable state. Callbacks for another
 * attempt, a settled attempt, or an effect running in process are ignored.
 */
function planWorkerCallback(input: {
  readonly runId: string
  readonly state: RunState
  readonly callback: WorkerCallbackInput
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

  // A message already handed to a worker cannot be pulled back. Tell it to stop instead.
  if (
    execution?.attempt === callback.attempt &&
    execution.status === 'cancel_requested' &&
    callback.kind !== 'cancelled'
  ) {
    return Effect.succeed(CANCELLED)
  }

  if (
    !execution ||
    execution.attempt !== callback.attempt ||
    (isRunTerminal(state) && !isCancellationAcknowledgement) ||
    (!item && !isCancellationAcknowledgement) ||
    execution.status === 'running' ||
    execution.status === 'retry_wait' ||
    execution.status === 'timed_out' ||
    execution.status === 'ambiguous' ||
    (callback.kind === 'cancelled' && !isCancellationAcknowledgement)
  ) {
    return Effect.succeed(STALE)
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
        item && (execution.status === 'dispatched' || execution.status === 'dispatch_wait')
          ? accepted([workerStartedEvent(runId, item, callback.attempt, retry, now)])
          : STALE,
      )
    }

    case 'heartbeat': {
      const implicitStart =
        execution.status === 'dispatched' || execution.status === 'dispatch_wait'

      if (
        !item ||
        (!implicitStart && execution.status !== 'started' && execution.status !== 'heartbeat')
      ) {
        return Effect.succeed(STALE)
      }

      const recorded = {
        effectId: item.effectId,
        attempt: callback.attempt,
        heartbeatAt: now,
        deadlineAt: workerDeadline(retry, execution.startedAt ?? now, now),
      }

      const payload =
        callback.details === undefined ? recorded : { ...recorded, details: callback.details }

      return Effect.succeed(
        accepted(
          [
            ...(implicitStart
              ? [workerStartedEvent(runId, item, callback.attempt, retry, now)]
              : []),
            createEvent(runId, {
              type: 'runtime.effect.heartbeat',
              payload,
              threadId: item.threadId,
              origin: WORKER_ORIGIN,
            }),
          ],
          [notice('effect.heartbeat')],
        ),
      )
    }

    case 'complete': {
      if (!item) {
        return Effect.succeed(STALE)
      }

      return Effect.forEach(callback.events, (event) =>
        materializeEffectOutcome(registry.catalogs, runId, item, event),
      ).pipe(
        Effect.map((outcomes) =>
          accepted([
            ...outcomes,
            createEvent(runId, {
              type: 'runtime.effect.completed',
              payload: { effectId: item.effectId, attempt: callback.attempt },
              threadId: item.threadId,
              effectId: item.effectId,
              causationId: item.causingEventId,
              origin: WORKER_ORIGIN,
            }),
          ]),
        ),
      )
    }

    case 'fail': {
      if (!item) {
        return Effect.succeed(STALE)
      }

      const failure = planAttemptFailure({
        runId,
        item,
        attempt: callback.attempt,
        error: callback.error,
        now,
        retry,
        origin: WORKER_ORIGIN,
        nonRetryable: callback.nonRetryable,
        retryAfterMs: callback.retryAfterMs,
      })

      return Effect.succeed(
        accepted(
          [failure.event],
          failure.retrying
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
        ),
      )
    }

    case 'cancelled': {
      return Effect.succeed(
        accepted(
          [
            createEvent(runId, {
              type: 'runtime.effect.cancelled',
              payload: { effectId: callback.effectId, attempt: callback.attempt },
              threadId: item?.threadId ?? null,
              effectId: callback.effectId,
              origin: WORKER_ORIGIN,
            }),
          ],
          [notice('effect.cancellation')],
          true,
        ),
      )
    }

    default: {
      const exhaustiveCheck: never = callback
      return exhaustiveCheck
    }
  }
}

export function createWorkerCallbacks(options: WorkerCallbacksOptions) {
  const { registry, repository, withRunIngress } = options

  const applyWorkerCallback = (runId: string, callback: WorkerCallbackInput) =>
    withRunIngress(
      runId,
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const now = yield* Clock.currentTimeMillis

        const committed = yield* repository.commit(store, runId, (cursor) =>
          planWorkerCallback({ runId, state: cursor.state, callback, registry, now }).pipe(
            Effect.map((plan) => {
              // Domain events from the worker are already durable before the next wake.
              // Satisfy waits in this commit so a workflow parked on the result can continue.
              const folded = foldRun(plan.events, registry, { runId, initial: cursor.state })

              const satisfied = waitSatisfiedEvents(folded, plan.events).map((input) =>
                createEvent(runId, input),
              )

              return {
                events: [...plan.events, ...satisfied],
                value: { notices: plan.notices, result: plan.result },
              }
            }),
          ),
        )

        if (committed.append) {
          for (const notice of committed.value.notices) {
            notifyObserver(options.observer, notice)
          }
        }

        return committed.value.result
      }),
    ).pipe(Effect.tap((result) => (result.status === 'stale' ? Effect.void : options.wake(runId))))

  const workerSecrets = (runId: string, callback: WorkerCallback) =>
    Effect.gen(function* () {
      const store = yield* EventStoreTag
      const { state } = yield* repository.loadCursor(store, runId)
      const execution = state.effectExecutions[callback.effectId]

      if (execution?.attempt !== callback.attempt || isRunTerminal(state)) {
        return { status: 'stale' } satisfies WorkerSecretsResult
      }

      if (execution.status === 'cancel_requested') {
        return { status: 'cancelled' } satisfies WorkerSecretsResult
      }

      if (execution.status !== 'started' && execution.status !== 'heartbeat') {
        return { status: 'stale' } satisfies WorkerSecretsResult
      }

      const secrets = store.runSecrets ? yield* store.runSecrets.get(runId) : {}
      return { status: 'accepted', secrets } satisfies WorkerSecretsResult
    })

  return { workerCallback: applyWorkerCallback, workerSecrets }
}
