import {
  Clock,
  Deferred,
  Effect,
  Exit,
  Fiber,
  Option,
  Queue,
  type Context,
  type ManagedRuntime,
} from 'effect'

import {
  createEvent,
  deferredUntil,
  EventStoreTag,
  foldRun,
  isRunTerminal,
  type ComposedRegistry,
  type DefinitionResolver,
  type EventEnvelope,
  type EventStore,
  type OutstandingEffect,
  type RunCursor,
  type RunLauncher,
  type RunState,
} from '@looms/core'

import { childCloseCancellations, notifyLaunchingParent } from './child-run'
import {
  nextRuntimeDeadline,
  planDeadlineTransitions,
  planTerminalCancellationTransitions,
} from './deadline-transition-planner'
import { admitOrFailAttempt } from './effect-admission'
import {
  DuplicateEffectDispatchError,
  MaxWakeIterationsError,
  RuntimeExecutionError,
} from './errors'
import {
  cascadedCancellations,
  groupOutstanding,
  stripSeq,
  synthesizedThreadFailed,
  waitSatisfiedEvents,
} from './helpers'
import { executeLocalEffects } from './local-effect-executor'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import {
  requestWakeAgain,
  type RunExecutionContexts,
  type WakeCompletion,
} from './run-execution-context'
import type { LoomsRuntime, EffectWorker } from './types'
import type { WakeScheduler } from './wake-scheduler'
import { dispatchWorkerEffect, isWorkerEffect, planWorkerEffects } from './worker-effect-dispatch'

type SettledGroup = {
  readonly groupKey: string
  readonly exit: Exit.Exit<ReadonlyArray<EventEnvelope>, Error>
}

type InFlightGroup = {
  readonly groupKey: string
  readonly fiber: Fiber.Fiber<void, never>
  readonly effectIds: ReadonlyArray<string>
}

function currentTimeMillis(): number {
  return Math.floor(performance.timeOrigin + performance.now())
}

export interface WakeEngineOptions {
  readonly registry: ComposedRegistry
  readonly services: ManagedRuntime.ManagedRuntime<Context.Service.Any, never>
  readonly definitionResolver: DefinitionResolver
  readonly executionContexts: RunExecutionContexts
  readonly repository: RuntimeRepository
  readonly snapshotEvery: number
  readonly maxWakeIterations: number
  readonly maxInFlightWorkerEffects?: number
  readonly worker?: EffectWorker
  readonly observer?: RuntimeObserver
  readonly scheduler: () => WakeScheduler
  readonly launcher: () => RunLauncher
}

export function createWakeEngine(options: WakeEngineOptions): LoomsRuntime['wake'] {
  const {
    registry,
    services,
    definitionResolver,
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

  const closeLaunchedRuns = (store: EventStore, runId: string, cursor: RunCursor) =>
    Effect.gen(function* () {
      let next = cursor
      const state = next.state

      if (isRunTerminal(state) && state.launchedRuns.length > 0) {
        // Record close.requested once so closeWaiting / terminate policy is durable, then cancel
        // every remaining child. Retries keep cancelling while launchedRuns is non-empty even after
        // childCloseSent, so a partial cancel failure cannot orphan the rest.
        if (!state.childCloseSent) {
          const requested = createEvent(runId, {
            type: 'runtime.child.close.requested',
            payload: { policy: 'terminate' },
            threadId: state.rootThreadId,
            origin: { type: 'system' },
            idempotencyKey: `child-close:${runId}`,
          })

          const appended = yield* appendObserved(store, runId, stripSeq([requested]))
          next = yield* applyAppend(store, runId, next, stripSeq([requested]), appended)
        }

        yield* Effect.forEach(
          next.state.launchedRuns,
          (child) => options.launcher().cancel(child.runId),
          {
            concurrency: 1,
            discard: true,
          },
        )
      }

      if (isRunTerminal(next.state)) {
        yield* notifyLaunchingParent(options.launcher(), runId, next.state)
      }

      return next
    })

  return (runId) =>
    Effect.gen(function* () {
      observe({ type: 'run.wake', runId, at: currentTimeMillis() })
      const executionContext = executionContexts.get(runId)

      // Claim synchronously before any yield so concurrent fibers cannot both pass.
      if (executionContext.waking) {
        // Capture before requestWakeAgain: resolving wakeSignal can let the owner park
        // and clear wakeCompletion before this joiner awaits it.
        const activeCompletion = executionContext.wakeCompletion
        requestWakeAgain(executionContext)

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
        executionContext.wakeSignal = null
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
        const secrets = store.runSecrets ? yield* store.runSecrets.get(runId) : {}
        const runInContext = Effect.runPromiseWith(yield* Effect.context())
        executionContext.liveStore = store

        let finalState: RunState | undefined

        do {
          let cursor = yield* loadCursor(store, runId)
          const closeEvents = childCloseCancellations(cursor.state)

          if (closeEvents.length > 0) {
            const created = closeEvents.map((input) => createEvent(runId, input))
            const appended = yield* appendObserved(store, runId, stripSeq(created))
            cursor = yield* applyAppend(store, runId, cursor, stripSeq(created), appended)
          }

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

            cursor = yield* closeLaunchedRuns(store, runId, cursor)

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
          const inFlight = new Map<string, InFlightGroup>()
          const settled = yield* Queue.unbounded<SettledGroup>()
          let guard = 0
          // Deadlines at or before this instant were handled by the last loop iteration.
          let plannedAt = Number.NEGATIVE_INFINITY

          const foldProduced = (produced: ReadonlyArray<EventEnvelope>) =>
            Effect.gen(function* () {
              if (produced.length === 0) {
                return
              }

              yield* liveAppends.drain(runId)
              const beforeFold = cursor.state
              const intermediateState = foldRun(produced, registry, { runId, initial: beforeFold })

              const synthesized = [
                ...synthesizedThreadFailed(beforeFold, intermediateState, produced),
                ...cascadedCancellations(intermediateState, produced),
              ]

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
            })

          const attemptFor = (item: OutstandingEffect): number => {
            const execution = cursor.state.effectExecutions[item.effectId]

            return execution?.status === 'running' && startedEffectIds.has(item.effectId)
              ? execution.attempt
              : (execution?.attempt ?? 0) + 1
          }

          const dispatchKeyFor = (item: OutstandingEffect): string =>
            `${item.effectId}:${attemptFor(item)}`

          while (!isRunTerminal(cursor.state)) {
            if (guard >= maxWakeIterations) {
              return yield* new MaxWakeIterationsError(runId, maxWakeIterations)
            }

            guard += 1

            // A signal (or coalesced join) may have appended events while local effects ran.
            if (executionContext.wakeAgain) {
              executionContext.wakeAgain = false
              cursor = yield* loadCursor(store, runId)
            }

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
              maxInFlightWorkerEffects: options.maxInFlightWorkerEffects,
              secrets,
            })

            if (workerPlans.length > 0) {
              for (const workerPlan of workerPlans) {
                const admission = yield* admitOrFailAttempt({
                  registry,
                  item: workerPlan.item,
                  runId,
                  attempt: workerPlan.attempt,
                  now,
                  attributes: state.attributes ?? {},
                  secrets,
                  trace: state.startIdentity?.trace ?? null,
                  retry: workerPlan.retry,
                })

                if (admission._tag === 'reject') {
                  if (admission.observation) {
                    observe(admission.observation)
                  }

                  const failureAppend = yield* appendObserved(
                    store,
                    runId,
                    stripSeq([admission.event]),
                  )

                  cursor = yield* applyAppend(
                    store,
                    runId,
                    cursor,
                    stripSeq([admission.event]),
                    failureAppend,
                  )

                  continue
                }

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

                const dispatchEvent = yield* dispatchWorkerEffect(
                  runId,
                  workerPlan,
                  options.worker,
                  now,
                )

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
              const dueAt = deferredUntil(item.effect)

              return !(
                (dueAt !== undefined && dueAt > now + 5) ||
                (cancellationTargets.has(item.threadId) && item.effect.type !== 'runtime.cancel') ||
                isWorkerEffect({ runId, item, execution, registry, worker: options.worker }) ||
                (execution?.status === 'retry_wait' &&
                  execution.nextAttemptAt !== null &&
                  execution.nextAttemptAt > now)
              )
            })

            // Effects still running in a forked fiber are skipped so a mid-flight signal can
            // plan other threads. Effects that were dispatched, settled with events, and remain
            // outstanding (e.g. a handler that never completed its own effectId) still trip the
            // duplicate guard.
            const inFlightEffectIds = new Set(
              [...inFlight.values()].flatMap((entry) => entry.effectIds),
            )

            for (const item of outstanding) {
              const dispatchKey = dispatchKeyFor(item)

              if (!dispatchedEffectIds.has(dispatchKey)) {
                continue
              }

              if (inFlightEffectIds.has(item.effectId)) {
                continue
              }

              return yield* new DuplicateEffectDispatchError(runId, item.effectId, item.threadId)
            }

            const due = outstanding.filter((item) => !dispatchedEffectIds.has(dispatchKeyFor(item)))

            if (due.length > 0) {
              const attempts = new Map(due.map((item) => [item.effectId, attemptFor(item)]))

              for (const item of due) {
                dispatchedEffectIds.add(`${item.effectId}:${attempts.get(item.effectId) ?? 1}`)
              }

              const attemptEvents = due.map((item) =>
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

              for (const item of due) {
                observe({
                  type: 'effect.attempt',
                  runId,
                  at: now,
                  effectId: item.effectId,
                  attempt: attempts.get(item.effectId) ?? 1,
                })
              }

              const attemptAppend = yield* appendObserved(store, runId, stripSeq(attemptEvents))

              for (const item of due) {
                startedEffectIds.add(item.effectId)
              }

              cursor = yield* applyAppend(
                store,
                runId,
                cursor,
                stripSeq(attemptEvents),
                attemptAppend,
              )

              const executorOptions = {
                registry,
                services,
                definitionResolver,
                executionContext,
                liveAppends,
                runInContext,
                observe,
                launcher: options.launcher(),
              }

              const runContext = {
                correlationId: cursor.state.startIdentity?.correlationId ?? runId,
                attributes: cursor.state.attributes ?? {},
                secrets,
                trace: cursor.state.startIdentity?.trace ?? null,
              }

              // One fiber per (thread, causingSeq) group keeps in-group order and frees the
              // wake loop to plan other threads while a group is still running.
              for (const groupKey of groupOutstanding(due)) {
                const groupItems = due.filter(
                  (item) => `${item.threadId}:${item.causingSeq}` === groupKey,
                )

                // Child fiber: interrupted if the wake itself is interrupted; completions
                // are collected via the settled queue so the wake can replan mid-flight.
                const fiber = yield* Effect.forkChild(
                  executeLocalEffects(executorOptions, {
                    runId,
                    context: runContext,
                    outstanding: groupItems,
                    attempts,
                    now,
                  }).pipe(
                    Effect.exit,
                    Effect.flatMap((exit) => Queue.offer(settled, { groupKey, exit })),
                    Effect.asVoid,
                  ),
                )

                inFlight.set(groupKey, {
                  groupKey,
                  fiber,
                  effectIds: groupItems.map((item) => item.effectId),
                })
              }
            }

            if (inFlight.size === 0) {
              break
            }

            const wakeGate = Deferred.makeUnsafe<void>()
            executionContext.wakeSignal = wakeGate

            if (executionContext.wakeAgain) {
              Deferred.doneUnsafe(wakeGate, Effect.void)
            }

            const progress = yield* Effect.raceFirst(
              Queue.take(settled).pipe(
                Effect.map((item) => ({ _tag: 'settled' as const, ...item })),
              ),
              Deferred.await(wakeGate).pipe(Effect.as({ _tag: 'wake' as const })),
            )

            if (executionContext.wakeSignal === wakeGate) {
              executionContext.wakeSignal = null
            }

            if (progress._tag === 'wake') {
              continue
            }

            inFlight.delete(progress.groupKey)

            if (Exit.isFailure(progress.exit)) {
              return yield* Effect.failCause(progress.exit.cause)
            }

            const produced = progress.exit.value
            yield* foldProduced(produced)

            // Match the previous "empty batch → park" behavior. Aborted attempts produce no
            // events; force a wakeAgain re-entry so attempt claims reset and post-interrupt
            // work (a steered follow-up turn) can run under a fresh dispatchedEffectIds set.
            if (produced.length === 0 && inFlight.size === 0) {
              executionContext.wakeAgain = true
              break
            }
          }

          if (inFlight.size > 0) {
            yield* Fiber.interruptAll([...inFlight.values()].map((entry) => entry.fiber))
            inFlight.clear()
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

          if (isRunTerminal(cursor.state)) {
            cursor = yield* closeLaunchedRuns(store, runId, cursor)
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
