import { Clock, Effect, Exit, Option, type Context, type ManagedRuntime } from 'effect'

import {
  createEvent,
  EventStoreTag,
  foldRun,
  isRunTerminal,
  type ComposedRegistry,
  type EventEnvelope,
  type RegisteredDefinition,
  type RunState,
} from '@looms/core'

import {
  nextRuntimeDeadline,
  planDeadlineTransitions,
  planTerminalCancellationTransitions,
} from './deadline-transition-planner'
import {
  DuplicateEffectDispatchError,
  MaxWakeIterationsError,
  RuntimeExecutionError,
} from './errors'
import { stripSeq, synthesizedThreadFailed, waitSatisfiedEvents } from './helpers'
import { executeLocalEffects } from './local-effect-executor'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import type { RunExecutionContexts, WakeCompletion } from './run-execution-context'
import type { LoomsRuntime, EffectWorker } from './types'
import type { WakeScheduler } from './wake-scheduler'
import { dispatchWorkerEffect, isWorkerEffect, planWorkerEffects } from './worker-effect-dispatch'

function currentTimeMillis(): number {
  return Math.floor(performance.timeOrigin + performance.now())
}

export interface WakeEngineOptions {
  readonly registry: ComposedRegistry
  readonly services: ManagedRuntime.ManagedRuntime<Context.Service.Any, never>
  readonly definitions: ReadonlyMap<string, RegisteredDefinition>
  readonly executionContexts: RunExecutionContexts
  readonly repository: RuntimeRepository
  readonly snapshotEvery: number
  readonly maxWakeIterations: number
  readonly worker?: EffectWorker
  readonly observer?: RuntimeObserver
  readonly scheduler: () => WakeScheduler
}

export function createWakeEngine(options: WakeEngineOptions): LoomsRuntime['wake'] {
  const {
    registry,
    services,
    definitions,
    executionContexts,
    repository,
    snapshotEvery,
    maxWakeIterations,
  } = options

  const { appendObserved, applyAppend, liveAppends, loadCursor, persistSnapshot } = repository

  const runCache = {
    delete: repository.deleteCachedCursor,
    set: repository.setCachedCursor,
  }

  const observe = (event: Parameters<RuntimeObserver['observe']>[0]) =>
    notifyObserver(options.observer, event)

  return (runId) =>
    Effect.gen(function* () {
      observe({ type: 'run.wake', runId, at: currentTimeMillis() })
      const executionContext = executionContexts.get(runId)

      // Claim synchronously before any yield so concurrent fibers cannot both pass.
      if (executionContext.waking) {
        executionContext.wakeAgain = true
        const activeCompletion = executionContext.wakeCompletion

        if (!activeCompletion) {
          return yield* new RuntimeExecutionError(
            `Run "${runId}" has an active wake without completion state`,
          )
        }

        const completion = yield* Effect.promise(() => activeCompletion)

        if (Exit.isFailure(completion)) {
          return yield* Effect.failCause(completion.cause)
        }

        return completion.value
      }

      let resolveCompletion!: (completion: WakeCompletion) => void

      // oxlint-disable-next-line effecttsgo/new-promise
      executionContext.wakeCompletion = new Promise<WakeCompletion>((resolve) => {
        resolveCompletion = resolve
      })

      executionContext.resolveWakeCompletion = resolveCompletion

      executionContext.waking = true
      let released = false

      const releaseWake = (): void => {
        released = true
        executionContext.waking = false
        executionContext.wakeAgain = false
        executionContext.wakeCompletion = null
        executionContext.resolveWakeCompletion = null
        executionContext.liveStore = undefined
        liveAppends.clear(runId)
        executionContext.liveCount = 0
        executionContexts.releaseIfIdle(runId)
      }

      // Checking for a joined wake and releasing the claim must happen without yielding, or a wake
      // requested in between would join a completion that never saw its events.
      const releaseUnlessWokenAgain = (): boolean => {
        if (executionContext.wakeAgain) {
          executionContext.wakeAgain = false
          return false
        }

        releaseWake()
        return true
      }

      return yield* Effect.gen(function* () {
        const store = yield* EventStoreTag
        const runInContext = Effect.runPromiseWith(yield* Effect.context())
        executionContext.liveStore = store

        let finalState: RunState | undefined

        do {
          let cursor = yield* loadCursor(store, runId)

          if (isRunTerminal(cursor.state)) {
            const now = yield* Clock.currentTimeMillis

            const events = planTerminalCancellationTransitions({
              runId,
              state: cursor.state,
              now,
            })

            if (events.length > 0) {
              const appended = yield* appendObserved(store, runId, stripSeq(events))
              cursor = yield* applyAppend(store, runId, cursor, stripSeq(events), appended)
            }

            const nextDeadline = nextRuntimeDeadline(cursor.state, now)

            if (nextDeadline !== undefined) {
              yield* options.scheduler().schedule(runId, nextDeadline)
            } else {
              yield* options.scheduler().cancel(runId)
            }

            finalState = cursor.state
            continue
          }

          executionContext.liveCount = 0
          const dispatchedEffectIds = new Set<string>()
          const startedEffectIds = new Set<string>()
          let guard = 0
          // Deadlines at or before this instant were handled by the last loop iteration.
          let plannedAt = Number.NEGATIVE_INFINITY

          while (!isRunTerminal(cursor.state)) {
            if (guard >= maxWakeIterations) {
              return yield* new MaxWakeIterationsError(runId, maxWakeIterations)
            }

            guard += 1
            const state = cursor.state
            const now = yield* Clock.currentTimeMillis
            plannedAt = now

            const deadlinePlan = planDeadlineTransitions({ runId, state, registry, now })

            if (deadlinePlan.events.length > 0) {
              for (const notice of deadlinePlan.timerNotices) {
                observe({
                  type: 'timer.late',
                  runId,
                  at: now,
                  timerId: notice.timerId,
                  latenessMs: notice.latenessMs,
                })
              }

              for (const notice of deadlinePlan.timeoutNotices) {
                observe({
                  type: 'effect.timeout',
                  runId,
                  at: now,
                  effectId: notice.effectId,
                  attempt: notice.attempt,
                  detail: notice.timeout,
                })
              }

              const append =
                deadlinePlan.timerNotices.length > 0
                  ? yield* appendObserved(store, runId, stripSeq(deadlinePlan.events), {
                      expectedTail: cursor.seq,
                    }).pipe(
                      Effect.asSome,
                      Effect.catchTag('EventStoreConflictError', () => Effect.succeedNone),
                    )
                  : Option.some(yield* appendObserved(store, runId, stripSeq(deadlinePlan.events)))

              if (Option.isNone(append)) {
                runCache.delete(runId)
                cursor = yield* loadCursor(store, runId)
                continue
              }

              cursor = yield* applyAppend(
                store,
                runId,
                cursor,
                stripSeq(deadlinePlan.events),
                append.value,
              )

              continue
            }

            const workerPlans = planWorkerEffects({
              runId,
              state,
              registry,
              worker: options.worker,
              now,
            })

            if (workerPlans.length > 0) {
              for (const workerPlan of workerPlans) {
                if (workerPlan.queuedEvent) {
                  const queuedAppend = yield* appendObserved(
                    store,
                    runId,
                    stripSeq([workerPlan.queuedEvent]),
                  )

                  cursor = yield* applyAppend(
                    store,
                    runId,
                    cursor,
                    stripSeq([workerPlan.queuedEvent]),
                    queuedAppend,
                  )
                }

                const dispatchEvent = yield* dispatchWorkerEffect(runId, workerPlan, options.worker)

                const dispatchAppend = yield* appendObserved(
                  store,
                  runId,
                  stripSeq([dispatchEvent]),
                )

                cursor = yield* applyAppend(
                  store,
                  runId,
                  cursor,
                  stripSeq([dispatchEvent]),
                  dispatchAppend,
                )
              }

              continue
            }

            const cancellationTargets = new Set(
              state.outstandingEffects.flatMap((item) =>
                item.effect.type === 'runtime.cancel' && 'threadId' in item.effect
                  ? [item.effect.threadId]
                  : [],
              ),
            )

            const outstanding = state.outstandingEffects.filter((item) => {
              const execution = state.effectExecutions[item.effectId]
              return !(
                (cancellationTargets.has(item.threadId) && item.effect.type !== 'runtime.cancel') ||
                isWorkerEffect({ runId, item, execution, registry, worker: options.worker }) ||
                (execution?.status === 'retry_wait' &&
                  execution.nextAttemptAt !== null &&
                  execution.nextAttemptAt > now)
              )
            })

            if (outstanding.length === 0) {
              break
            }

            const attempts = new Map(
              outstanding.map((item) => {
                const execution = state.effectExecutions[item.effectId]

                const attempt =
                  execution?.status === 'running' && startedEffectIds.has(item.effectId)
                    ? execution.attempt
                    : (execution?.attempt ?? 0) + 1

                return [item.effectId, attempt]
              }),
            )

            for (const item of outstanding) {
              const dispatchKey = `${item.effectId}:${attempts.get(item.effectId) ?? 1}`

              if (dispatchedEffectIds.has(dispatchKey)) {
                return yield* new DuplicateEffectDispatchError(runId, item.effectId, item.threadId)
              }
            }

            for (const item of outstanding) {
              dispatchedEffectIds.add(`${item.effectId}:${attempts.get(item.effectId) ?? 1}`)
            }

            const attemptEvents = outstanding.map((item) =>
              createEvent(runId, {
                type: 'runtime.effect.attempt.started',
                payload: {
                  effectId: item.effectId,
                  attempt: attempts.get(item.effectId) ?? 1,
                },
                threadId: item.threadId,
                origin: { type: 'system' },
              }),
            )

            for (const item of outstanding) {
              observe({
                type: 'effect.attempt',
                runId,
                at: now,
                effectId: item.effectId,
                attempt: attempts.get(item.effectId) ?? 1,
              })
            }

            const attemptAppend = yield* appendObserved(store, runId, stripSeq(attemptEvents))

            for (const item of outstanding) {
              startedEffectIds.add(item.effectId)
            }

            cursor = yield* applyAppend(
              store,
              runId,
              cursor,
              stripSeq(attemptEvents),
              attemptAppend,
            )

            const produced = yield* executeLocalEffects(
              {
                registry,
                services,
                definitions,
                executionContext,
                liveAppends,
                runInContext,
                observe,
              },
              { runId, outstanding, attempts, now },
            )

            if (produced.length === 0) {
              break
            }

            yield* liveAppends.drain(runId)
            const beforeFold = cursor.state
            const intermediateState = foldRun(produced, registry, { runId, initial: beforeFold })
            const synthesized = synthesizedThreadFailed(beforeFold, intermediateState, produced)
            const synthesizedEvents = synthesized.map((input) => createEvent(runId, input))

            const stateAfterSynth =
              synthesizedEvents.length > 0
                ? foldRun(synthesizedEvents, registry, { runId, initial: intermediateState })
                : intermediateState

            const allNewEvents = [...produced, ...synthesizedEvents]
            const satisfied = waitSatisfiedEvents(stateAfterSynth, allNewEvents)
            const satisfiedEvents = satisfied.map((input) => createEvent(runId, input))
            const fullBatch = [...allNewEvents, ...satisfiedEvents]

            const appendResult = yield* appendObserved(store, runId, stripSeq(fullBatch))
            cursor = yield* applyAppend(store, runId, cursor, stripSeq(fullBatch), appendResult)

            // Bound replay after a crash inside a long wake.
            if (snapshotEvery > 0 && cursor.durableSinceSnapshot >= snapshotEvery) {
              cursor = yield* persistSnapshot(store, runId, cursor)
            }
          }

          const root = cursor.state.rootThreadId
            ? cursor.state.threads[cursor.state.rootThreadId]
            : undefined

          if (
            root &&
            (root.status === 'completed' ||
              root.status === 'failed' ||
              root.status === 'cancelled') &&
            !isRunTerminal(cursor.state)
          ) {
            const completed: EventEnvelope =
              root.status === 'cancelled'
                ? createEvent(runId, {
                    type: 'runtime.run.cancelled',
                    payload: { reason: root.error ?? 'cancelled' },
                    threadId: null,
                    origin: { type: 'system' },
                  })
                : createEvent(runId, {
                    type: 'runtime.run.completed',
                    payload: {
                      output: root.output,
                      error: root.error,
                    },
                    threadId: null,
                    origin: { type: 'system' },
                  })

            const appendResult = yield* appendObserved(store, runId, stripSeq([completed]))
            cursor = yield* applyAppend(store, runId, cursor, stripSeq([completed]), appendResult)
          }

          // Snapshot on park: the next wake (on any instance) starts from here.
          cursor = yield* persistSnapshot(store, runId, cursor)
          const nextDeadline = nextRuntimeDeadline(cursor.state, plannedAt)

          if (nextDeadline !== undefined) {
            yield* options.scheduler().schedule(runId, nextDeadline)
          } else {
            yield* options.scheduler().cancel(runId)
          }

          if (isRunTerminal(cursor.state)) {
            observe({
              type: 'run.terminal',
              runId,
              at: currentTimeMillis(),
              status: cursor.state.status,
            })

            runCache.delete(runId)
          } else {
            observe({
              type: 'run.park',
              runId,
              at: currentTimeMillis(),
              status: cursor.state.status,
            })

            runCache.set(runId, cursor)
          }

          finalState = cursor.state
        } while (!releaseUnlessWokenAgain())

        if (!finalState) {
          return yield* new RuntimeExecutionError(`Wake for run "${runId}" completed without state`)
        }

        return finalState
      }).pipe(
        Effect.onExit((exit) =>
          Effect.sync(() => {
            if (!released) {
              releaseWake()
            }

            resolveCompletion(exit)
          }),
        ),
      )
    })
}
