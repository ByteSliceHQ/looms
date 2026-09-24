import { Clock, Effect } from 'effect'

import {
  createEvent,
  EventStoreTag,
  isRunTerminal,
  type ComposedRegistry,
  type EventEnvelope,
  type EventInput,
  type EventStoreAppendError,
  type EventStoreError,
  type RunState,
} from '@looms/core'

import { RuntimeExecutionError } from './errors'
import { materializeEffectOutcome, stripSeq, createEffectFailedEvent } from './helpers'
import type { RunIngress } from './ingress'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import { retryBackoff } from './retry-policy'
import type { EffectWorker, LoomsRuntime, WorkerCallback } from './types'

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
              if (!item) {
                return state
              }

              if (execution.status !== 'dispatched') {
                return state
              }

              produced = [
                createEvent(runId, {
                  type: 'runtime.effect.worker.started',
                  payload: {
                    effectId: item.effectId,
                    attempt: callback.attempt,
                    deadlineAt: retry?.startToCloseTimeoutMs
                      ? now + retry.startToCloseTimeoutMs
                      : null,
                  },
                  threadId: item.threadId,
                  origin: { type: 'external', actorId: 'worker' },
                }),
              ]

              break
            }

            case 'heartbeat': {
              if (!item) {
                return state
              }

              if (execution.status !== 'started' && execution.status !== 'heartbeat') {
                return state
              }

              produced = [
                createEvent(runId, {
                  type: 'runtime.effect.heartbeat',
                  payload: {
                    effectId: item.effectId,
                    attempt: callback.attempt,
                    heartbeatAt: now,
                    deadlineAt: retry?.heartbeatTimeoutMs
                      ? Math.min(
                          execution.deadlineAt ?? Number.MAX_SAFE_INTEGER,
                          now + retry.heartbeatTimeoutMs,
                        )
                      : execution.deadlineAt,
                  },
                  threadId: item.threadId,
                  origin: { type: 'external', actorId: 'worker' },
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
                  origin: { type: 'external', actorId: 'worker' },
                }),
              )

              break
            }

            case 'fail': {
              if (!item) {
                return state
              }

              if (retry && callback.attempt < retry.maxAttempts) {
                observe({
                  type: 'effect.retry',
                  runId,
                  at: now,
                  effectId: item.effectId,
                  attempt: callback.attempt,
                  detail: callback.error,
                })

                produced = [
                  createEvent(runId, {
                    type: 'runtime.effect.retry.scheduled',
                    payload: {
                      effectId: item.effectId,
                      attempt: callback.attempt,
                      nextAttemptAt: now + retryBackoff(retry, callback.attempt),
                      error: callback.error,
                    },
                    threadId: item.threadId,
                    causationId: item.causingEventId,
                    origin: { type: 'external', actorId: 'worker' },
                  }),
                ]
              } else {
                produced = [createEffectFailedEvent(runId, item, callback.error)]
              }

              break
            }

            case 'cancelled': {
              produced = [
                createEvent(runId, {
                  type: 'runtime.effect.cancelled',
                  payload: { effectId: callback.effectId, attempt: callback.attempt },
                  threadId: item?.threadId ?? null,
                  effectId: callback.effectId,
                  origin: { type: 'external', actorId: 'worker' },
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
