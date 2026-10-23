import { Data, Effect, Predicate } from 'effect'

import {
  EventStoreTag,
  makeMemoryEventStore,
  makeMemorySnapshotStore,
  snapshotStoreOf,
  withBlobOffload,
  SnapshotStoreTag,
  type AnyRuntimeModule,
  type DebuggerHost,
  type DefinitionInput,
  type DefinitionRef,
  type DefinitionResolver,
  type EventEnvelope,
  type EventInput,
  type BlobStore,
  type EventStore,
  type EventStoreTrimCoverage,
  type JsonValue,
  type SnapshotStore,
  type ProjectionDefinition,
  type ReplayStep,
  type RunLauncher,
  type RunState,
} from '@looms/core'

import type { RuntimeObserver } from './observer'
import {
  createRuntime,
  type EffectWorker,
  type LoomsRuntime,
  type RunOperationalStatus,
  type StartRunArgs,
  type WakeScheduler,
  type WorkerCallbackInput,
  type WorkerCallbackResult,
} from './runtime'
import {
  createFetchHandler,
  handlesPath,
  mountDebugger,
  serveHttp,
  type Authorize,
  type RunningServer,
} from './server'

export interface CreateLoomsOptions {
  /** Runtime modules to enable. Pass `agent()`, `workflow()`, `approval()`, and/or your own. */
  readonly modules?: readonly AnyRuntimeModule[]
  /**
   * Loads a definition that was not registered on a module. Registered definitions are checked
   * first. A run pins the resolved version on its start event.
   */
  readonly definitionResolver?: DefinitionResolver
  readonly store?: EventStore | Promise<EventStore> | (() => Promise<EventStore>)
  readonly serve?: boolean | { port?: number; hostname?: string }
  readonly maxWakeIterations?: number
  /** Maximum active and queued mutation operations per run. Default 256. */
  readonly maxPendingRunOperations?: number
  /** Durable events between mid-wake snapshots. Default 200; `0` disables. Parking always snapshots. */
  readonly snapshotEvery?: number
  /** Defaults to the EventStore's attached store (S2) or an in-memory SnapshotStore. */
  readonly snapshotStore?: SnapshotStore
  /**
   * Content-addressed store for JSON values that would exceed the 1 MiB event limit or the
   * 8 MiB snapshot limit. Reads resolve references before folds, projections, and callers see them.
   */
  readonly blobStore?: BlobStore
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
  /** Starts runs from effect handlers. Defaults to launching into this runtime's own store. */
  readonly launcher?: RunLauncher
  readonly worker?: EffectWorker
  /** Maximum concurrent in-flight worker effects dispatched per run (fairness guard). */
  readonly maxInFlightWorkerEffects?: number
  /** Failure-isolated runtime observation sink. */
  readonly observer?: RuntimeObserver
  /**
   * Authorizes HTTP API requests. Without it, run reads and writes are open while worker callback
   * and operations routes return 503; `bearerAuth({ worker, operations })` enables them.
   *
   * A mounted debugger is authorized as `{ access: 'read', name: 'debugger' }`. Bearer tokens on
   * reads block browser navigation. `grantAuth` covers a browser EventSource or WebSocket that can
   * only send a query parameter or a subprotocol.
   */
  readonly authorize?: Authorize
  /**
   * Serves a debugger UI under `debugger.basePath` (for example `/debugger`). The runtime does not
   * bundle a UI; pass `debuggerUi()` from `@swirls/looms/debugger/server`.
   */
  readonly debugger?: DebuggerHost
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
    options?: {
      runId?: string
      threadId?: string
      idempotencyKey?: string
      attributes?: StartRunArgs['attributes']
      secrets?: StartRunArgs['secrets']
      trace?: StartRunArgs['trace']
    },
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
    attributes?: StartRunArgs['attributes']
    secrets?: StartRunArgs['secrets']
    trace?: StartRunArgs['trace']
  }): Promise<StartResult>
  /** Commit a run's start and schedule a wake without waiting for it. */
  launchRun(args: {
    kind: string
    definitionName: string
    definitionVersion?: string
    input?: JsonValue
    runId?: string
    threadId?: string
    idempotencyKey?: string
    attributes?: StartRunArgs['attributes']
    secrets?: StartRunArgs['secrets']
    trace?: StartRunArgs['trace']
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
  /** Start a new run that continues where a finished run ended. */
  fork(sourceRunId: string, options?: { runId?: string }): Promise<StartResult>
  workerCallback(runId: string, input: WorkerCallbackInput): Promise<WorkerCallbackResult>
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

  const debuggerMount = options.debugger ? mountDebugger(options.debugger) : undefined
  let initPromise: Promise<Initialized> | undefined
  let runningServer: RunningServer | undefined

  const getInit = (): Promise<Initialized> => {
    if (!initPromise) {
      initPromise = Effect.runPromise(
        Effect.gen(function* () {
          const configuredStore = options.store

          let store = !configuredStore
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

          if (options.blobStore) {
            const snapshots =
              options.snapshotStore ?? snapshotStoreOf(store) ?? (yield* makeMemorySnapshotStore)

            store = withBlobOffload(store, options.blobStore, { snapshots })
          }

          const runtime = createRuntime({
            modules,
            store,
            maxWakeIterations: options.maxWakeIterations,
            maxPendingRunOperations: options.maxPendingRunOperations,
            snapshotEvery: options.snapshotEvery,
            snapshotStore: options.blobStore
              ? snapshotStoreOf(store)
              : (options.snapshotStore ?? snapshotStoreOf(store)),
            trimAfterSnapshot: options.trimAfterSnapshot,
            runCacheSize: options.runCacheSize,
            scheduler: options.scheduler,
            launcher: options.launcher,
            localLauncher: options.launcher === undefined,
            worker: options.worker,
            maxInFlightWorkerEffects: options.maxInFlightWorkerEffects,
            observer: options.observer,
            definitionResolver: options.definitionResolver,
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
            authorize: options.authorize,
            debugger: debuggerMount,
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
    launchRun: (args) => runEffect((i) => i.runtime.launchRun(args)),
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
          attributes: startOpts?.attributes,
          secrets: startOpts?.secrets,
          trace: startOpts?.trace,
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
    fork: (sourceRunId, forkOpts) => runEffect((i) => i.runtime.fork(sourceRunId, forkOpts)),
    workerCallback: (runId, input) => runEffect((i) => i.runtime.workerCallback(runId, input)),
    fetch: (req) => {
      if (!handlesPath(new URL(req.url).pathname, debuggerMount)) {
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
