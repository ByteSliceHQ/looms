import { Data, Effect, Predicate } from 'effect'

import {
  EventStoreTag,
  makeMemoryEventStore,
  snapshotStoreOf,
  SnapshotStoreTag,
  type AnyRuntimeModule,
  type DefinitionInput,
  type DefinitionRef,
  type EventEnvelope,
  type EventInput,
  type EventStore,
  type EventStoreTrimCoverage,
  type JsonValue,
  type SnapshotStore,
  type ProjectionDefinition,
  type ReplayStep,
  type RunState,
} from '@looms/core'

import type { RuntimeObserver } from './observer'
import {
  createRuntime,
  type EffectWorker,
  type LoomsRuntime,
  type RunOperationalStatus,
  type WakeScheduler,
  type WorkerCallbackInput,
} from './runtime'
import { createFetchHandler, isLoomsApiPath, serveHttp, type RunningServer } from './server'

export interface CreateLoomsOptions {
  /** Runtime modules to enable. Pass `agent()`, `workflow()`, `approval()`, and/or your own. */
  readonly modules?: readonly AnyRuntimeModule[]
  readonly store?: EventStore | Promise<EventStore> | (() => Promise<EventStore>)
  readonly serve?: boolean | { port?: number; hostname?: string }
  readonly maxWakeIterations?: number
  /** Maximum active and queued mutation operations per run. Default 256. */
  readonly maxPendingRunOperations?: number
  /** Durable events between mid-wake snapshots. Default 200; `0` disables. Parking always snapshots. */
  readonly snapshotEvery?: number
  /** Defaults to the EventStore's attached store (S2) or an in-memory SnapshotStore. */
  readonly snapshotStore?: SnapshotStore
  readonly trimAfterSnapshot?: {
    keepSnapshots: number
    coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
  /** In-process cursor cache size. Default `0` (stateless between calls). */
  readonly runCacheSize?: number
  /** Scan existing runs for pending timers on boot. Default true. */
  readonly rescanTimers?: boolean
  /** Pluggable wake scheduler for timer waits. Defaults to an in-process Effect fiber scheduler. */
  readonly scheduler?: WakeScheduler
  readonly worker?: EffectWorker
  /** Failure-isolated runtime observation sink. */
  readonly observer?: RuntimeObserver
  /** Bearer token required by worker callback HTTP routes. */
  readonly workerCallbackToken?: string
  /** Bearer token required by mutation-capable operational HTTP routes. */
  readonly operationsToken?: string
}

export interface StartResult {
  readonly runId: string
  readonly threadId: string
  readonly state: RunState
}

export interface Looms {
  readonly runtime: Promise<LoomsRuntime>
  readonly store: Promise<EventStore>
  ready(): Promise<{ store: EventStore; runtime: LoomsRuntime }>
  /** Start a run from a definition object; the input type follows the definition's schema. */
  start<TDef extends DefinitionRef>(
    definition: TDef,
    input?: DefinitionInput<TDef>,
    options?: { runId?: string; threadId?: string; idempotencyKey?: string },
  ): Promise<StartResult>
  /** Start a run by `{ kind, definitionName }` when you only have names (HTTP bodies, CLIs). */
  startRun(args: {
    kind: string
    definitionName: string
    definitionVersion?: string
    input?: JsonValue
    runId?: string
    threadId?: string
    idempotencyKey?: string
  }): Promise<StartResult>
  getRun(runId: string): Promise<RunState>
  getEvents(runId: string, options?: { fromSeq?: number; limit?: number }): Promise<EventEnvelope[]>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string },
  ): Promise<RunState>
  wake(runId: string): Promise<RunState>
  rescanTimers(): Promise<number>
  recoverDeadlines(): Promise<number>
  inspectRun(runId: string): Promise<RunOperationalStatus>
  retryEffect(runId: string, effectId: string): Promise<RunState>
  listRuns(): Promise<string[]>
  project<S>(runId: string, definition: ProjectionDefinition<S>): Promise<S>
  replayTo(runId: string, seq: number): Promise<ReplayStep | null>
  cancel(runId: string, threadId?: string): Promise<RunState>
  workerCallback(runId: string, input: WorkerCallbackInput): Promise<RunState>
  fetch(req: Request): Promise<Response | null>
  serve(options?: { port?: number; hostname?: string }): RunningServer
  stop(): Promise<void>
}

interface Initialized {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  readonly snapshotStore?: SnapshotStore
  readonly fetchHandler: (req: Request) => Promise<Response | null>
}

class LoomsInitializationError extends Data.TaggedError('LoomsInitializationError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'LoomsInitializationError'
  }
}

export function createLooms(options: CreateLoomsOptions = {}): Looms {
  const modules = options.modules ?? []
  let initPromise: Promise<Initialized> | undefined
  let runningServer: RunningServer | undefined

  const getInit = (): Promise<Initialized> => {
    if (!initPromise) {
      initPromise = Effect.runPromise(
        Effect.gen(function* () {
          const configuredStore = options.store

          const store = !configuredStore
            ? yield* makeMemoryEventStore
            : Predicate.isFunction(configuredStore)
              ? yield* Effect.tryPromise({
                  try: configuredStore,
                  catch: (cause) => new LoomsInitializationError(cause),
                })
              : configuredStore instanceof Promise
                ? yield* Effect.tryPromise({
                    try: () => configuredStore,
                    catch: (cause) => new LoomsInitializationError(cause),
                  })
                : configuredStore

          const runtime = createRuntime({
            modules,
            store,
            maxWakeIterations: options.maxWakeIterations,
            maxPendingRunOperations: options.maxPendingRunOperations,
            snapshotEvery: options.snapshotEvery,
            snapshotStore: options.snapshotStore ?? snapshotStoreOf(store),
            trimAfterSnapshot: options.trimAfterSnapshot,
            runCacheSize: options.runCacheSize,
            scheduler: options.scheduler,
            worker: options.worker,
            observer: options.observer,
          })

          if (options.rescanTimers !== false) {
            yield* runtime.rescanTimers.pipe(
              Effect.provideService(EventStoreTag, store),
              Effect.tapError(Effect.logError),
              Effect.ignore,
            )
          }

          const fetchHandler = createFetchHandler({
            runtime,
            store,
            workerCallbackToken: options.workerCallbackToken,
            operationsToken: options.operationsToken,
          })

          return { runtime, store, snapshotStore: snapshotStoreOf(store), fetchHandler }
        }),
      )
    }

    return initPromise
  }

  const runEffect = <A>(
    fn: (init: Initialized) => Effect.Effect<A, Error, EventStoreTag>,
  ): Promise<A> =>
    getInit().then((init) => {
      let provided = Effect.provideService(fn(init), EventStoreTag, init.store)

      if (init.snapshotStore) {
        provided = Effect.provideService(provided, SnapshotStoreTag, init.snapshotStore)
      }

      return Effect.runPromise(provided)
    })

  const looms: Looms = {
    get runtime() {
      return getInit().then((i) => i.runtime)
    },
    get store() {
      return getInit().then((i) => i.store)
    },
    ready: () => getInit().then(({ store, runtime }) => ({ store, runtime })),
    startRun: (args) => runEffect((i) => i.runtime.startRun(args)),
    start: (definition, input, startOpts) =>
      runEffect((i) =>
        i.runtime.startRun({
          kind: definition.kind,
          definitionName: definition.name,
          definitionVersion: definition.version,
          // SAFETY: input is validated against the definition's schema inside startRun.
          input: input,
          runId: startOpts?.runId,
          threadId: startOpts?.threadId,
          idempotencyKey: startOpts?.idempotencyKey,
        }),
      ),
    getRun: (runId) => runEffect((i) => i.runtime.getRun(runId)),
    getEvents: (runId, opts) => runEffect((i) => i.runtime.getEvents(runId, opts)),
    signal: (runId, events, signalOpts) =>
      runEffect((i) => i.runtime.signal(runId, events, signalOpts)),
    wake: (runId) => runEffect((i) => i.runtime.wake(runId)),
    rescanTimers: () => runEffect((i) => i.runtime.rescanTimers),
    recoverDeadlines: () => runEffect((i) => i.runtime.recoverDeadlines),
    inspectRun: (runId) => runEffect((i) => i.runtime.inspectRun(runId)),
    retryEffect: (runId, effectId) => runEffect((i) => i.runtime.retryEffect(runId, effectId)),
    listRuns: () => runEffect((i) => i.runtime.listRuns),
    project: (runId, definition) => runEffect((i) => i.runtime.project(runId, definition)),
    replayTo: (runId, seq) => runEffect((i) => i.runtime.replayTo(runId, seq)),
    cancel: (runId, threadId) => runEffect((i) => i.runtime.cancel(runId, threadId)),
    workerCallback: (runId, input) => runEffect((i) => i.runtime.workerCallback(runId, input)),
    fetch: (req) => {
      if (!isLoomsApiPath(new URL(req.url).pathname)) {
        return Promise.resolve(null)
      }

      return getInit().then(({ fetchHandler }) => fetchHandler(req))
    },
    serve: (serveOpts) => {
      if (runningServer) {
        return runningServer
      }

      runningServer = serveHttp((req) => looms.fetch(req), serveOpts)
      return runningServer
    },
    stop: () => {
      if (runningServer) {
        runningServer.stop()
        runningServer = undefined
      }

      return initPromise
        ? initPromise.then(({ runtime }) => Effect.runPromise(runtime.dispose))
        : Promise.resolve()
    },
  }

  if (options.serve) {
    looms.serve(options.serve === true ? {} : options.serve)
  }

  return looms
}
