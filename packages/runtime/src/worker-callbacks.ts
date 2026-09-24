import { Clock, Effect, Predicate } from 'effect'

import {
  createEvent,
  EventStoreTag,
  isRunTerminal,
  type ComposedRegistry,
  type EventEnvelope,
  type EventInput,
  type EventStoreAppendError,
  type EventStoreError,
  type OutstandingEffect,
  type RetryPolicy,
  type RunState,
} from '@looms/core'

import { RuntimeExecutionError } from './errors'
import { materializeEffectOutcome, stripSeq } from './helpers'
import type { RunIngress } from './ingress'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import { planAttemptFailure } from './retry-policy'
import type { EffectWorker, LoomsRuntime, WorkerCallback } from './types'

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
  readonly runtime: () => LoomsRuntime
  readonly worker?: EffectWorker
}

export function createWorkerCallbacks(options: WorkerCallbacksOptions) {
  const { registry, repository, withRunIngress } = options
  const { appendObserved, loadCursor, deleteCachedCursor } = repository
  const runCache = { delete: deleteCachedCursor }

  const observe = (event: Parameters<RuntimeObserver['observe']>[0]) =>
    notifyObserver(options.observer, event)

  const applyWorkerCallback = (
    runId: string,
    callback:
      | (WorkerCallback & { kind: 'started' | 'heartbeat' | 'cancelled' })
      | (WorkerCallback & { kind: 'complete'; events: ReadonlyArray<EventInput> })
      | (WorkerCallback & { kind: 'fail'; error: string }),
  ): Effect.Effect<RunState, Error | EventStoreAppendError | EventStoreError, EventStoreTag> =>
    withRunIngress(
      runId,
      Effect.gen(function* () {
        const store = yield* EventStoreTag

        for (let conflicts = 0; conflicts < 16; conflicts += 1) {
          const cursor = yield* loadCursor(store, runId)
          const state = cursor.state
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
            return state
          }

          const now = yield* Clock.currentTimeMillis
          const retry = item ? registry.effects.get(item.effect.type)?.retry : undefined
          let produced: EventEnvelope[]

          if (callback.kind === 'heartbeat' || callback.kind === 'cancelled') {
            observe({
              type: callback.kind === 'heartbeat' ? 'effect.heartbeat' : 'effect.cancellation',
              runId,
              at: now,
              effectId: callback.effectId,
              attempt: callback.attempt,
            })
          }

          switch (callback.kind) {
            case 'started': {
              if (!item || execution.status !== 'dispatched') {
                return state
              }

              produced = [workerStartedEvent(runId, item, callback.attempt, retry, now)]
              break
            }

            case 'heartbeat': {
              if (!item) {
                return state
              }

              const implicitStart = execution.status === 'dispatched'

              if (
                !implicitStart &&
                execution.status !== 'started' &&
                execution.status !== 'heartbeat'
              ) {
                return state
              }

              produced = [
                ...(implicitStart
                  ? [workerStartedEvent(runId, item, callback.attempt, retry, now)]
                  : []),
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
              ]

              break
            }

            case 'complete': {
              if (!item) {
                return state
              }

              produced = []

              for (const input of callback.events) {
                produced.push(
                  yield* materializeEffectOutcome(registry.catalogs, runId, item, input),
                )
              }

              produced.push(
                createEvent(runId, {
                  type: 'runtime.effect.completed',
                  payload: { effectId: item.effectId, attempt: callback.attempt },
                  threadId: item.threadId,
                  effectId: item.effectId,
                  causationId: item.causingEventId,
                  origin: WORKER_ORIGIN,
                }),
              )

              break
            }

            case 'fail': {
              if (!item) {
                return state
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

              if (failure.retrying) {
                observe({
                  type: 'effect.retry',
                  runId,
                  at: now,
                  effectId: item.effectId,
                  attempt: callback.attempt,
                  detail: callback.error,
                })
              }

              produced = [failure.event]
              break
            }

            case 'cancelled': {
              produced = [
                createEvent(runId, {
                  type: 'runtime.effect.cancelled',
                  payload: { effectId: callback.effectId, attempt: callback.attempt },
                  threadId: item?.threadId ?? null,
                  effectId: callback.effectId,
                  origin: WORKER_ORIGIN,
                }),
              ]

              break
            }

            default: {
              const exhaustiveCheck: never = callback
              return exhaustiveCheck
            }
          }

          const appended = yield* appendObserved(store, runId, stripSeq(produced), {
            expectedTail: cursor.seq,
          }).pipe(
            Effect.map(() => true),
            Effect.catchTag('EventStoreConflictError', () => Effect.succeed(false)),
          )

          if (appended) {
            runCache.delete(runId)
            return cursor.state
          }

          runCache.delete(runId)
        }

        return yield* new RuntimeExecutionError(`Could not append worker callback for "${runId}"`)
      }),
    ).pipe(Effect.andThen(options.runtime().wake(runId)))

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
