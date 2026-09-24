import { Clock, Effect, ManagedRuntime, Predicate } from 'effect'

import {
  composeModules,
  createEvent,
  createThreadId,
  createRunId,
  DEFAULT_DEFINITION_VERSION,
  DEFAULT_SNAPSHOT_EVERY,
  definitionKey,
  EventStoreTag,
  foldRun,
  project,
  replayTo,
  type AnyRuntimeModule,
  type EventInput,
  type InvalidEventError,
} from '@looms/core'

import { createCancellation } from './cancellation'
import { nextRuntimeDeadline } from './deadline-transition-planner'
import { RuntimeExecutionError, type StartRunConflictError } from './errors'
import {
  admitExternalEvents,
  moduleServices,
  resolveSnapshotStore,
  RunCursorCache,
  threadStartedEvents,
  UnknownDefinitionError,
  validateAndCreateEvents,
  waitSatisfiedEvents,
} from './helpers'
import { createRunIngress } from './ingress'
import { notifyObserver, type RuntimeObserver } from './observer'
import { createRuntimeRepository, type CommitPlan } from './repository'
import { RunExecutionContexts } from './run-execution-context'
import { assertSameDurableStart } from './run-start'
import { createWakeEngine } from './wake-engine'
import { createTimeoutScheduler, type WakeScheduler } from './wake-scheduler'
import { createWorkerCallbacks } from './worker-callbacks'

export type { RegisteredDefinition } from '@looms/core'
export type { WakeScheduler } from './wake-scheduler'
export { createTimeoutScheduler } from './wake-scheduler'
export {
  DuplicateEffectDispatchError,
  MaxWakeIterationsError,
  StartRunConflictError,
} from './errors'
export { RunOverloadedError } from './ingress'

export type {
  CreateRuntimeOptions,
  EffectWorker,
  EffectWorkerTask,
  LoomsRuntime,
  RunOperationalStatus,
  StartResult,
  StartRunArgs,
  WakeError,
  WorkerCallback,
} from './types'
import type { CreateRuntimeOptions, LoomsRuntime } from './types'

function currentTimeMillis(): number {
  return Math.floor(performance.timeOrigin + performance.now())
}

/** Threads whose in-process effects an admitted signal interrupts. */
function interruptedThreadIds(events: readonly EventInput[]): ReadonlySet<string> {
  const threadIds = new Set<string>()

  for (const event of events) {
    const payload = Predicate.isObject(event.payload) ? event.payload : {}

    if (event.type === 'runtime.thread.cancel.requested' && Predicate.isString(payload.threadId)) {
      threadIds.add(payload.threadId)
    } else if (event.type === 'agent.steered' && payload.interrupt === true && event.threadId) {
      threadIds.add(event.threadId)
    }
  }

  return threadIds
}

const DEFAULT_RUN_CACHE_SIZE = 0
const RESCAN_CONCURRENCY = 16
const DEFAULT_KEEP_SNAPSHOTS = 1
const DEFAULT_MAX_PENDING_RUN_OPERATIONS = 256

export function createRuntime<const TModules extends readonly AnyRuntimeModule[]>(
  options: CreateRuntimeOptions<TModules>,
): LoomsRuntime<TModules> {
  const registry = composeModules(options.modules)
  const registeredDefinitions = registry.definitions

  const definitions = new Map(
    registeredDefinitions.map(
      (def) => [definitionKey(def.kind, def.name, def.version), def] as const,
    ),
  )

  // Module composition erases the heterogeneous service identifier union at this host boundary.
  // oxlint-disable-next-line effecttsgo/any-unknown-in-error-context
  const services = ManagedRuntime.make(moduleServices(options.modules))
  const executionContexts = new RunExecutionContexts()

  const maxPendingRunOperations =
    options.maxPendingRunOperations ?? DEFAULT_MAX_PENDING_RUN_OPERATIONS

  const snapshotEvery = options.snapshotEvery ?? DEFAULT_SNAPSHOT_EVERY
  const maxWakeIterations = options.maxWakeIterations ?? 100
  const snapshotStore = resolveSnapshotStore(options.snapshotStore, options.store)
  const trimAfterSnapshot = options.trimAfterSnapshot
  const keepSnapshots = trimAfterSnapshot?.keepSnapshots ?? DEFAULT_KEEP_SNAPSHOTS
  const runCache = new RunCursorCache(options.runCacheSize ?? DEFAULT_RUN_CACHE_SIZE)

  const observe = (event: Parameters<RuntimeObserver['observe']>[0]) =>
    notifyObserver(options.observer, event)

  const withRunIngress = createRunIngress(executionContexts, maxPendingRunOperations)

  const repository = createRuntimeRepository({
    registry,
    snapshotStore,
    trimAfterSnapshot,
    keepSnapshots,
    runCache,
    executionContexts,
    observer: options.observer,
  })

  const { commit, loadCursor } = repository

  const signalAdmitted: LoomsRuntime<TModules>['signal'] = (runId, events, signalOpts) =>
    Effect.gen(function* () {
      const store = yield* EventStoreTag
      const signalKey = signalOpts?.idempotencyKey

      const committed = yield* commit(store, runId, (current) =>
        Effect.gen(function* () {
          const processed = current.state.processedIdempotencyKeys

          const filteredEvents =
            signalKey && processed.includes(signalKey)
              ? []
              : events.filter((input) => {
                  const key = input.idempotencyKey ?? signalKey
                  return !key || !processed.includes(key)
                })

          if (filteredEvents.length === 0) {
            return { events: [], value: current.state }
          }

          const batch = yield* validateAndCreateEvents(
            registry.catalogs,
            runId,
            filteredEvents.map((input) => ({
              ...input,
              idempotencyKey: input.idempotencyKey ?? signalKey,
            })),
            { origin: { type: 'external' } },
          )

          const folded = foldRun(batch, registry, { runId, initial: current.state })

          const satisfiedEvents = waitSatisfiedEvents(folded, batch).map((input) =>
            createEvent(runId, input),
          )

          return {
            events: [...batch, ...satisfiedEvents],
            value: current.state,
            idempotencyKey: signalKey ? `signal:${signalKey}` : undefined,
          }
        }),
      )

      if (committed.append) {
        executionContexts.abort(runId, interruptedThreadIds(events), 'Effect interrupted')
      }

      return committed.value
    })

  let scheduler: WakeScheduler
  let runtime: LoomsRuntime<TModules>

  const wakeEngine = createWakeEngine({
    registry,
    services,
    definitions,
    executionContexts,
    repository,
    snapshotEvery,
    maxWakeIterations,
    worker: options.worker,
    observer: options.observer,
    scheduler: () => scheduler,
  })

  const workerCallbacks = createWorkerCallbacks({
    registry,
    repository,
    withRunIngress,
    observer: options.observer,
    wake: wakeEngine,
  })

  const cancellation = createCancellation({
    registry,
    repository,
    executionContexts,
    worker: options.worker,
    observer: options.observer,
    wake: wakeEngine,
    withRunIngress,
  })

  runtime = {
    modules: options.modules,
    registry,
    ...workerCallbacks,
    listRuns: Effect.gen(function* () {
      const store = yield* EventStoreTag
      return yield* store.listRuns
    }),

    getEvents: (runId, readOptions) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        return yield* store.read(runId, readOptions)
      }),

    getRun: (runId) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const cursor = yield* loadCursor(store, runId)
        return cursor.state
      }),

    project: (runId, definition) =>
      Effect.gen(function* () {
        const events = yield* runtime.getEvents(runId)
        return project(definition, events)
      }),

    replayTo: (runId, seq) =>
      Effect.gen(function* () {
        const events = yield* runtime.getEvents(runId)
        return replayTo(events, registry, seq)
      }),

    inspectRun: (runId) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const state = yield* runtime.getRun(runId)
        const tail = yield* store.tail(runId)
        const bounds = store.bounds ? yield* store.bounds(runId) : { head: 1, tail }

        const effects = state.outstandingEffects.map((item) => {
          const execution = state.effectExecutions[item.effectId]
          return {
            effectId: item.effectId,
            threadId: item.threadId,
            type: item.effect.type,
            attempt: execution?.attempt ?? 0,
            status: execution?.status ?? 'pending',
            deadlineAt: execution?.deadlineAt ?? null,
            lastError: execution?.lastError ?? null,
          }
        })

        return { runId, state, head: bounds.head, tail, effects }
      }),

    retryEffect: (runId, effectId) =>
      withRunIngress(
        runId,
        Effect.gen(function* () {
          const store = yield* EventStoreTag

          yield* commit(store, runId, (cursor) =>
            Effect.gen(function* () {
              const execution = cursor.state.effectExecutions[effectId]

              const item = cursor.state.outstandingEffects.find(
                (candidate) => candidate.effectId === effectId,
              )

              if (!execution || !item) {
                return yield* new RuntimeExecutionError(`Unknown outstanding effect "${effectId}"`)
              }

              if (
                execution.status !== 'ambiguous' &&
                execution.status !== 'timed_out' &&
                execution.status !== 'cancel_requested'
              ) {
                return yield* new RuntimeExecutionError(
                  `Effect "${effectId}" cannot be retried from status "${execution.status}"`,
                )
              }

              const now = yield* Clock.currentTimeMillis

              const retryEvent = createEvent(runId, {
                type: 'runtime.effect.retry.scheduled',
                payload: {
                  effectId,
                  attempt: execution.attempt,
                  nextAttemptAt: now,
                  error: `operator retry from ${execution.status}`,
                },
                threadId: item.threadId,
                causationId: item.causingEventId,
                origin: { type: 'external', actorId: 'operator' },
              })

              return { events: [retryEvent], value: undefined }
            }),
          )
        }),
      ).pipe(Effect.andThen(runtime.wake(runId))),

    rescanTimers: Effect.gen(function* () {
      const store = yield* EventStoreTag
      const runIds = yield* store.listRuns

      const scheduled = yield* Effect.forEach(
        runIds,
        (runId) =>
          Effect.gen(function* () {
            const deadline = nextRuntimeDeadline(yield* runtime.getRun(runId))

            if (deadline === undefined) {
              return false
            }

            yield* scheduler.schedule(runId, deadline)
            return true
          }),
        { concurrency: RESCAN_CONCURRENCY },
      )

      return scheduled.filter(Boolean).length
    }),

    recoverDeadlines: Effect.suspend(() => runtime.rescanTimers),

    startRun: (args) => {
      const runId = args.runId ?? createRunId()

      return withRunIngress(
        runId,
        Effect.gen(function* () {
          const definitionVersion = args.definitionVersion ?? DEFAULT_DEFINITION_VERSION

          if (!definitions.get(definitionKey(args.kind, args.definitionName, definitionVersion))) {
            return yield* new UnknownDefinitionError(
              args.kind,
              args.definitionName,
              definitionVersion,
            )
          }

          const store = yield* EventStoreTag
          observe({ type: 'run.start', runId, at: currentTimeMillis() })

          const threadId = args.threadId ?? createThreadId()

          const startedEvents = yield* threadStartedEvents(definitions, {
            kind: args.kind,
            definitionName: args.definitionName,
            definitionVersion,
            input: args.input ?? null,
            threadId,
            parentThreadId: null,
          })

          const started = startedEvents[0]

          const startedInput =
            started && Predicate.isObject(started.payload)
              ? (started.payload.input ?? null)
              : (args.input ?? null)

          const requestedIdentity = {
            kind: args.kind,
            definitionName: args.definitionName,
            definitionVersion,
            input: startedInput,
            requestedThreadId: args.threadId ?? null,
            idempotencyKey: args.idempotencyKey ?? null,
          }

          const committed = yield* commit(
            store,
            runId,
            (
              existing,
            ): Effect.Effect<
              CommitPlan<string>,
              RuntimeExecutionError | StartRunConflictError | InvalidEventError
            > =>
              existing.seq > 0
                ? assertSameDurableStart(runId, existing.state, requestedIdentity).pipe(
                    Effect.map((rootThreadId) => ({ events: [], value: rootThreadId })),
                  )
                : validateAndCreateEvents(
                    registry.catalogs,
                    runId,
                    [
                      {
                        type: 'runtime.run.started',
                        payload: {
                          rootThreadId: threadId,
                          kind: args.kind,
                          definitionName: args.definitionName,
                          definitionVersion,
                          input: startedInput,
                          requestedThreadId: args.threadId ?? null,
                        },
                        threadId: null,
                        idempotencyKey: args.idempotencyKey,
                      },
                      ...startedEvents,
                    ],
                    { origin: { type: 'system' } },
                  ).pipe(
                    Effect.map((batch) => ({
                      events: batch,
                      value: threadId,
                      idempotencyKey: args.idempotencyKey
                        ? `start:${args.idempotencyKey}`
                        : undefined,
                    })),
                  ),
          )

          if (!committed.append?.deduplicated) {
            return committed.value
          }

          const durable = yield* loadCursor(store, runId)
          return yield* assertSameDurableStart(runId, durable.state, requestedIdentity)
        }),
      ).pipe(
        Effect.flatMap((threadId) =>
          runtime.wake(runId).pipe(
            Effect.map((state) => ({
              runId,
              threadId: state.rootThreadId ?? threadId,
              state,
            })),
          ),
        ),
      )
    },

    signal: (runId, events, signalOpts) =>
      admitExternalEvents(events).pipe(
        Effect.flatMap((admitted) =>
          withRunIngress(runId, signalAdmitted(runId, admitted, signalOpts)),
        ),
        Effect.andThen(runtime.wake(runId)),
      ),

    cancel: cancellation,

    wake: wakeEngine,

    dispose: Effect.sync(() => scheduler.dispose?.()).pipe(Effect.andThen(services.disposeEffect)),
  }

  scheduler =
    options.scheduler ??
    createTimeoutScheduler((runId) =>
      options.store
        ? runtime
            .wake(runId)
            .pipe(
              Effect.provideService(EventStoreTag, options.store),
              Effect.tapError(Effect.logError),
              Effect.ignore,
            )
        : Effect.void,
    )

  return runtime
}
