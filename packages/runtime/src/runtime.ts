import { Clock, Effect, ManagedRuntime, Predicate, type Types } from 'effect'

import {
  cachedDefinitionResolver,
  chainDefinitionResolvers,
  composeModules,
  createEvent,
  createThreadId,
  createRunId,
  DEFAULT_DEFINITION_VERSION,
  DEFAULT_SNAPSHOT_EVERY,
  staticDefinitionResolver,
  descendantThreadIds,
  EventStoreTag,
  foldRun,
  hasEntries,
  isRunTerminal,
  unavailableRunLauncher,
  planFork,
  project,
  readTraceContext,
  replayTo,
  sameStringRecord,
  summarizeRun,
  type EventStore,
  type SecretContext,
  type AnyRuntimeModule,
  type EventInput,
  type EventOrigin,
  type RunLauncher,
  type RunStartedPayload,
  type RunState,
  type SignalInterruptRule,
  type TraceContext,
  type InvalidEventError,
} from '@looms/core'

import { createCancellation } from './cancellation'
import { nextRuntimeDeadline } from './deadline-transition-planner'
import {
  ForkConflictError,
  RunNotFinishedError,
  RunNotFoundError,
  RunTerminalError,
  RuntimeExecutionError,
  SecretContextConflictError,
  StartRunConflictError,
} from './errors'
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
import { assertWorkerDeadlines } from './worker-effect-dispatch'

export type { RegisteredDefinition } from '@looms/core'
export type { WakeScheduler } from './wake-scheduler'
export { createTimeoutScheduler } from './wake-scheduler'
export {
  DuplicateEffectDispatchError,
  ForkConflictError,
  MaxWakeIterationsError,
  RunNotFinishedError,
  RunNotFoundError,
  RunTerminalError,
  StartRunConflictError,
} from './errors'
export { RunOverloadedError } from './ingress'

export type {
  CreateRuntimeOptions,
  EffectWorker,
  EffectWorkerDeadlines,
  EffectWorkerTask,
  LoomsRuntime,
  RunOperationalStatus,
  StartResult,
  StartRunArgs,
  WakeError,
} from './types'
export type { WorkerCallback, WorkerCallbackInput, WorkerCallbackResult } from '@looms/core'
import type { CreateRuntimeOptions, LoomsRuntime, StartRunArgs } from './types'

function currentTimeMillis(): number {
  return Math.floor(performance.timeOrigin + performance.now())
}

/** Threads whose in-process effects an admitted signal interrupts: each named one and its subtree. */
function interruptedThreadIds(
  events: readonly EventInput[],
  rules: readonly SignalInterruptRule[],
  state: RunState,
): ReadonlySet<string> {
  const named = events.flatMap((event) => {
    const payload = Predicate.isObject(event.payload) ? event.payload : {}

    const cancelled =
      event.type === 'runtime.thread.cancel.requested' && Predicate.isString(payload.threadId)
        ? [payload.threadId]
        : []

    return [...cancelled, ...rules.flatMap((rule) => rule(event))]
  })

  return new Set(named.flatMap((threadId) => [threadId, ...descendantThreadIds(state, threadId)]))
}

const DEFAULT_RUN_CACHE_SIZE = 0
const RESCAN_CONCURRENCY = 16
const DEFAULT_KEEP_SNAPSHOTS = 1
const DEFAULT_MAX_PENDING_RUN_OPERATIONS = 256

interface StartedPayloadInput {
  readonly threadId: string
  readonly kind: string
  readonly definitionName: string
  readonly definitionVersion: string
  readonly input: StartRunArgs['input']
  readonly requestedThreadId: string | null
  readonly launchedBy: StartRunArgs['launchedBy']
  readonly attributes: StartRunArgs['attributes']
  readonly trace: TraceContext | undefined
}

function startedPayload(input: StartedPayloadInput): RunStartedPayload {
  const payload: Types.Mutable<RunStartedPayload> = {
    rootThreadId: input.threadId,
    kind: input.kind,
    definitionName: input.definitionName,
    definitionVersion: input.definitionVersion,
    input: input.input ?? null,
    requestedThreadId: input.requestedThreadId,
  }

  if (input.launchedBy) {
    payload.launchedBy = input.launchedBy
  }

  if (input.attributes && hasEntries(input.attributes)) {
    payload.attributes = input.attributes
  }

  if (input.trace) {
    payload.trace = input.trace
  }

  return payload
}

function reconcileRunSecrets(
  store: EventStore,
  runId: string,
  requested: SecretContext | undefined,
) {
  const next = requested ?? {}

  return Effect.gen(function* () {
    const stored = store.runSecrets

    if (!stored) {
      if (hasEntries(next)) {
        return yield* new RuntimeExecutionError('This event store cannot persist a secret context')
      }

      return yield* Effect.void
    }

    const current = yield* stored.get(runId)

    if (sameStringRecord(current, next) || requested === undefined) {
      return yield* Effect.void
    }

    if (!hasEntries(current)) {
      return yield* stored.put(runId, next)
    }

    return yield* new SecretContextConflictError(runId)
  })
}

export function createRuntime<const TModules extends readonly AnyRuntimeModule[]>(
  options: CreateRuntimeOptions<TModules>,
): LoomsRuntime<TModules> {
  if (options.localLauncher && !options.store && !options.launcher) {
    throw new Error('localLauncher requires options.store')
  }

  const registry = composeModules(options.modules)

  assertWorkerDeadlines(registry, options.worker)

  const staticResolver = staticDefinitionResolver(
    registry.definitions.map((definition) => ({
      ...definition.value,
      kind: definition.kind,
      name: definition.name,
      version: definition.version,
    })),
  )

  const definitionResolver = cachedDefinitionResolver(
    options.definitionResolver
      ? chainDefinitionResolvers([staticResolver, options.definitionResolver])
      : staticResolver,
  )

  for (const module of options.modules) {
    module.bindHost?.({ definitionResolver })
  }

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
    definitionResolver,
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
            { origin: { type: 'external' }, threadId: current.state.rootThreadId },
          )

          const terminal = isRunTerminal(current.state)

          const settlementOnly = filteredEvents.every(
            (event) => event.type === 'runtime.child.settled',
          )

          if (terminal && !settlementOnly) {
            return yield* new RunTerminalError(runId, current.state.status)
          }

          const folded = foldRun(batch, registry, { runId, initial: current.state })

          const forWaits =
            terminal || current.state.closeWaiting
              ? batch.filter((event) => event.type !== 'runtime.child.settled')
              : batch

          const satisfiedEvents = waitSatisfiedEvents(folded, forWaits).map((input) =>
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
        executionContexts.abort(
          runId,
          interruptedThreadIds(events, registry.interruptRules, committed.value),
          'Effect interrupted',
        )
      }

      return committed.value
    })

  const commitStart = (args: StartRunArgs, runId: string) =>
    Effect.gen(function* () {
      const definitionVersion = args.definitionVersion ?? DEFAULT_DEFINITION_VERSION

      const resolved = yield* definitionResolver.resolve(
        args.kind,
        args.definitionName,
        definitionVersion,
      )

      if (!resolved) {
        return yield* new UnknownDefinitionError(args.kind, args.definitionName, definitionVersion)
      }

      const store = yield* EventStoreTag
      observe({ type: 'run.start', runId, at: currentTimeMillis() })

      const threadId = args.threadId ?? createThreadId()

      const startedEvents = yield* threadStartedEvents(definitionResolver, {
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
        launchedBy: args.launchedBy ?? null,
        correlationId: args.correlationId ?? null,
        attributes: args.attributes ?? {},
      }

      const origin: EventOrigin = args.launchedBy
        ? { type: 'run', runId: args.launchedBy.runId }
        : { type: 'system' }

      const startPayload = startedPayload({
        threadId,
        kind: args.kind,
        definitionName: args.definitionName,
        definitionVersion,
        input: startedInput,
        requestedThreadId: args.threadId ?? null,
        launchedBy: args.launchedBy,
        attributes: args.attributes,
        trace: args.trace && readTraceContext(args.trace.traceparent, args.trace.tracestate),
      })

      if (hasEntries(args.secrets ?? {}) && !store.runSecrets) {
        return yield* new RuntimeExecutionError('This event store cannot persist a secret context')
      }

      const committed = yield* commit(
        store,
        runId,
        (
          existing,
        ): Effect.Effect<
          CommitPlan<{ readonly threadId: string; readonly state: RunState }>,
          RuntimeExecutionError | StartRunConflictError | InvalidEventError
        > =>
          existing.seq > 0
            ? assertSameDurableStart(runId, existing.state, requestedIdentity).pipe(
                Effect.map((rootThreadId) => ({
                  events: [],
                  value: { threadId: rootThreadId, state: existing.state },
                })),
              )
            : validateAndCreateEvents(
                registry.catalogs,
                runId,
                [
                  {
                    type: 'runtime.run.started',
                    payload: startPayload,
                    threadId: null,
                    idempotencyKey: args.idempotencyKey,
                  },
                  ...startedEvents,
                ].map((event) => ({ ...event, correlationId: args.correlationId })),
                { origin },
              ).pipe(
                Effect.map((batch) => ({
                  events: batch,
                  value: {
                    threadId,
                    state: foldRun(batch, registry, { runId, initial: existing.state }),
                  },
                  idempotencyKey: args.idempotencyKey ? `start:${args.idempotencyKey}` : undefined,
                })),
              ),
      )

      yield* reconcileRunSecrets(store, runId, args.secrets)

      if (!committed.append?.deduplicated) {
        return committed.value
      }

      const durable = yield* loadCursor(store, runId)
      const rootThreadId = yield* assertSameDurableStart(runId, durable.state, requestedIdentity)
      return { threadId: rootThreadId, state: durable.state }
    })

  let scheduler: WakeScheduler
  let launcher: RunLauncher
  let runtime: LoomsRuntime<TModules>

  const wakeEngine = createWakeEngine({
    registry,
    services,
    executionContexts,
    repository,
    snapshotEvery,
    maxWakeIterations,
    maxInFlightWorkerEffects: options.maxInFlightWorkerEffects,
    worker: options.worker,
    observer: options.observer,
    definitionResolver,
    scheduler: () => scheduler,
    launcher: () => launcher,
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
    launcher: () => launcher,
  })

  const appendAndWake: LoomsRuntime<TModules>['accept'] = (runId, events, signalOpts) =>
    withRunIngress(runId, signalAdmitted(runId, events, signalOpts)).pipe(
      Effect.flatMap((state) => {
        if (signalOpts?.coalesce && executionContexts.get(runId).waking) {
          executionContexts.get(runId).wakeAgain = true
          return Effect.succeed(state)
        }

        return runtime.wake(runId)
      }),
    )

  runtime = {
    modules: options.modules,
    registry,
    ...workerCallbacks,
    listRuns: Effect.gen(function* () {
      const store = yield* EventStoreTag
      return yield* store.listRuns
    }),

    listRunSummaries: Effect.gen(function* () {
      const store = yield* EventStoreTag
      const runIds = yield* store.listRuns
      const indexed = yield* snapshotStore.listHeaders
      const byId = new Map(indexed.map((header) => [header.runId, header]))
      const missing = runIds.filter((runId) => !byId.has(runId))

      const filled = yield* Effect.forEach(
        missing,
        (runId) => runtime.getRun(runId).pipe(Effect.map(summarizeRun)),
        { concurrency: 8 },
      )

      for (const header of filled) {
        byId.set(header.runId, header)
      }

      return runIds.flatMap((runId) => {
        const header = byId.get(runId)
        return header ? [header] : []
      })
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

      return withRunIngress(runId, commitStart(args, runId)).pipe(
        Effect.flatMap((started) =>
          runtime.wake(runId).pipe(
            Effect.map((state) => ({
              runId,
              threadId: state.rootThreadId ?? started.threadId,
              state,
            })),
          ),
        ),
      )
    },

    launchRun: (args) => {
      const runId = args.runId ?? createRunId()

      return withRunIngress(runId, commitStart(args, runId)).pipe(
        Effect.flatMap((started) =>
          Effect.gen(function* () {
            if (!isRunTerminal(started.state)) {
              const now = yield* Clock.currentTimeMillis
              yield* scheduler.schedule(runId, now)
            }

            return {
              runId,
              threadId: started.state.rootThreadId ?? started.threadId,
              state: started.state,
            }
          }),
        ),
      )
    },

    signal: (runId, events, signalOpts) =>
      admitExternalEvents(events).pipe(
        Effect.flatMap((admitted) => appendAndWake(runId, admitted, signalOpts)),
      ),

    accept: (runId, events, signalOpts) => appendAndWake(runId, events, signalOpts),

    cancel: cancellation,

    fork: (sourceRunId, forkOptions) => {
      const runId = forkOptions?.runId ?? createRunId()

      return withRunIngress(
        runId,
        Effect.gen(function* () {
          const store = yield* EventStoreTag
          const source = yield* loadCursor(store, sourceRunId)

          if (source.seq === 0) {
            return yield* new RunNotFoundError(sourceRunId)
          }

          if (!isRunTerminal(source.state)) {
            return yield* new RunNotFinishedError(sourceRunId, source.state.status)
          }

          const plan = yield* planFork({
            sourceRunId,
            runId,
            events: yield* store.read(sourceRunId),
            registry,
          })

          // Appending at tail 0 numbers the copied events 1..n, the seqs they had in the source.
          yield* commit(store, runId, (existing) => {
            if (existing.seq === 0) {
              return Effect.succeed({ events: plan.events, value: undefined })
            }

            return existing.state.forkedFrom?.runId === sourceRunId
              ? Effect.succeed({ events: [], value: undefined })
              : Effect.fail(new ForkConflictError(runId, sourceRunId))
          })

          const parentSecrets = store.runSecrets ? yield* store.runSecrets.get(sourceRunId) : {}

          yield* reconcileRunSecrets(
            store,
            runId,
            hasEntries(parentSecrets) ? parentSecrets : undefined,
          )

          return plan.rootThreadId
        }),
      ).pipe(
        Effect.flatMap((threadId) =>
          runtime.wake(runId).pipe(Effect.map((state) => ({ runId, threadId, state }))),
        ),
      )
    },

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

  const store = options.store

  launcher =
    options.launcher ??
    (options.localLauncher && store
      ? {
          launch: (args) =>
            runtime.launchRun(args).pipe(
              Effect.provideService(EventStoreTag, store),
              Effect.catchIf(
                (error) => error instanceof StartRunConflictError,
                () => Effect.void,
              ),
              Effect.asVoid,
            ),
          status: (runId) =>
            runtime.getRun(runId).pipe(
              Effect.provideService(EventStoreTag, store),
              Effect.map((state) =>
                state.rootThreadId === null ? null : { status: state.status },
              ),
            ),
          signal: (runId, events, signalOptions) =>
            runtime
              .accept(runId, events, { ...signalOptions, coalesce: true })
              .pipe(Effect.provideService(EventStoreTag, store), Effect.asVoid),
          cancel: (runId) =>
            runtime.cancel(runId).pipe(Effect.provideService(EventStoreTag, store), Effect.asVoid),
        }
      : unavailableRunLauncher)

  return runtime
}
