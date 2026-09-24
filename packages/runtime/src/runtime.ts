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
  isRunTerminal,
  isWaitOnTimer,
  project,
  replayTo,
  type AnyRuntimeModule,
} from '@looms/core'

import { createCancellation } from './cancellation'
import { RuntimeExecutionError } from './errors'
import {
  admitExternalEvents,
  moduleServices,
  resolveSnapshotStore,
  RunCursorCache,
  stripSeq,
  threadStartedEvents,
  UnknownDefinitionError,
  validateAndCreateEvents,
  waitSatisfiedEvents,
} from './helpers'
import { createRunIngress } from './ingress'
import { notifyObserver, type RuntimeObserver } from './observer'
import { createRuntimeRepository } from './repository'
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

const DEFAULT_RUN_CACHE_SIZE = 0
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

  const abortActiveEffects = (
    runId: string,
    threadIds: ReadonlySet<string>,
    message: string,
  ): void => {
    const activeEffects = executionContexts.peek(runId)?.activeEffects

    if (!activeEffects) {
      return
    }

    for (const active of activeEffects.values()) {
      if (threadIds.has(active.threadId)) {
        active.controller.abort(new RuntimeExecutionError(message))
      }
    }
  }

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

  const { appendObserved, loadCursor, deleteCachedCursor } = repository
  const runCacheAccess = { delete: deleteCachedCursor }

  const signalAdmitted: LoomsRuntime<TModules>['signal'] = (runId, events, signalOpts) =>
    Effect.gen(function* () {
      const store = yield* EventStoreTag
      let conflicts = 0

      while (conflicts < 16) {
        const current = yield* loadCursor(store, runId)
        const currentState = current.state

        if (
          signalOpts?.idempotencyKey &&
          currentState.processedIdempotencyKeys.includes(signalOpts.idempotencyKey)
        ) {
          return currentState
        }

        const filteredEvents = events.filter((input) => {
          const key = input.idempotencyKey ?? signalOpts?.idempotencyKey
          return !key || !currentState.processedIdempotencyKeys.includes(key)
        })

        if (filteredEvents.length === 0) {
          return currentState
        }

        const batch = yield* validateAndCreateEvents(
          registry.catalogs,
          runId,
          filteredEvents.map((input) => ({
            ...input,
            idempotencyKey: input.idempotencyKey ?? signalOpts?.idempotencyKey,
          })),
          { origin: { type: 'external' } },
        )

        const folded = foldRun(batch, registry, { runId, initial: currentState })
        const satisfied = waitSatisfiedEvents(folded, batch)
        const satisfiedEvents = satisfied.map((input) => createEvent(runId, input))

        for (const event of batch) {
          const payload = Predicate.isObject(event.payload) ? event.payload : {}

          const requestedThreadId =
            event.type === 'runtime.thread.cancel.requested' && Predicate.isString(payload.threadId)
              ? payload.threadId
              : event.type === 'agent.steered' && payload.interrupt === true
                ? event.threadId
                : null

          if (!requestedThreadId) {
            continue
          }

          abortActiveEffects(runId, new Set([requestedThreadId]), 'Effect interrupted')
        }

        const appendOptions = signalOpts?.idempotencyKey
          ? {
              expectedTail: current.seq,
              idempotency: { key: `signal:${signalOpts.idempotencyKey}` },
            }
          : { expectedTail: current.seq }

        const result = yield* appendObserved(
          store,
          runId,
          stripSeq([...batch, ...satisfiedEvents]),
          appendOptions,
        ).pipe(
          Effect.map(() => true),
          Effect.catchTag('EventStoreConflictError', () => Effect.succeed(false)),
        )

        if (result) {
          return currentState
        }

        runCacheAccess.delete(runId)
        conflicts += 1
      }

      return yield* new RuntimeExecutionError(
        `Could not append signal to run "${runId}" after 16 conflicts`,
      )
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
    abortActiveEffects,
  })

  const workerCallbacks = createWorkerCallbacks({
    registry,
    repository,
    withRunIngress,
    observer: options.observer,
    runtime: () => runtime,
    worker: options.worker,
  })

  const cancellation = createCancellation({
    registry,
    repository,
    worker: options.worker,
    observer: options.observer,
    runtime: () => runtime,
    abortActiveEffects,
    signalAdmitted,
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
          const cursor = yield* loadCursor(store, runId)
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

          yield* appendObserved(store, runId, stripSeq([retryEvent]), {
            expectedTail: cursor.seq,
          })

          runCacheAccess.delete(runId)
          return undefined
        }),
      ).pipe(Effect.andThen(runtime.wake(runId))),

    rescanTimers: Effect.gen(function* () {
      const store = yield* EventStoreTag
      const runIds = yield* store.listRuns
      let count = 0

      for (const runId of runIds) {
        const runState = yield* runtime.getRun(runId)

        let earliestTimerAt: number | null = null

        if (!isRunTerminal(runState)) {
          for (const waitRecord of Object.values(runState.waits)) {
            if (isWaitOnTimer(waitRecord.on)) {
              if (earliestTimerAt === null || waitRecord.on.timerAt < earliestTimerAt) {
                earliestTimerAt = waitRecord.on.timerAt
              }
            }
          }
        }

        for (const execution of Object.values(runState.effectExecutions)) {
          if (
            (!isRunTerminal(runState) || execution.status === 'cancel_requested') &&
            execution.deadlineAt !== null &&
            (earliestTimerAt === null || execution.deadlineAt < earliestTimerAt)
          ) {
            earliestTimerAt = execution.deadlineAt
          }
        }

        if (earliestTimerAt !== null) {
          yield* scheduler.schedule(runId, earliestTimerAt)
          count += 1
        }
      }

      return count
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

          const existing = yield* loadCursor(store, runId)

          if (existing.seq > 0) {
            return yield* assertSameDurableStart(runId, existing.state, requestedIdentity)
          }

          const batch = yield* validateAndCreateEvents(
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
          )

          const appendOptions = args.idempotencyKey
            ? {
                expectedTail: existing.seq,
                idempotency: { key: `start:${args.idempotencyKey}` },
              }
            : { expectedTail: existing.seq }

          const requiresReload = yield* appendObserved(
            store,
            runId,
            stripSeq(batch),
            appendOptions,
          ).pipe(
            Effect.map((result) => result.deduplicated),
            Effect.catchTag('EventStoreConflictError', () => Effect.succeed(true)),
          )

          if (!requiresReload) {
            return threadId
          }

          runCacheAccess.delete(runId)
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
