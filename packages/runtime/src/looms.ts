import { Effect, Predicate } from 'effect'

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
  type JsonValue,
  type SnapshotStore,
  type ProjectionDefinition,
  type ReplayStep,
  type RunState,
} from '@looms/core'

import { createRuntime, type LoomsRuntime, type WakeScheduler } from './runtime'
import { createFetchHandler, isLoomsApiPath, serveHttp, type RunningServer } from './server'

export interface CreateLoomsOptions {
  /** Runtime modules to enable. Pass `agent()`, `workflow()`, `approval()`, and/or your own. */
  readonly modules?: readonly AnyRuntimeModule[]
  readonly store?: EventStore | Promise<EventStore> | (() => Promise<EventStore>)
  readonly serve?: boolean | { port?: number; hostname?: string }
  readonly maxWakeIterations?: number
  /** Durable events between mid-wake snapshots. Default 200; `0` disables. Parking always snapshots. */
  readonly snapshotEvery?: number
  /** Defaults to the EventStore's attached store (S2) or an in-memory SnapshotStore. */
  readonly snapshotStore?: SnapshotStore
  readonly trimAfterSnapshot?: { keepSnapshots: number }
  /** In-process cursor cache size. Default `0` (stateless between calls). */
  readonly runCacheSize?: number
  /** Scan existing runs for pending timers on boot. Default true. */
  readonly rescanTimers?: boolean
  /** Pluggable wake scheduler for timer waits. Defaults to an in-process setTimeout scheduler. */
  readonly scheduler?: WakeScheduler
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
  project<S>(runId: string, definition: ProjectionDefinition<S>): Promise<S>
  replayTo(runId: string, seq: number): Promise<ReplayStep | null>
  cancel(runId: string, threadId?: string): Promise<RunState>
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

export function createLooms(options: CreateLoomsOptions = {}): Looms {
  const modules = options.modules ?? []
  let initPromise: Promise<Initialized> | undefined
  let runningServer: RunningServer | undefined

  const getInit = (): Promise<Initialized> => {
    if (!initPromise) {
      initPromise = (async () => {
        let store: EventStore

        if (!options.store) {
          store = await Effect.runPromise(makeMemoryEventStore)
        } else if (Predicate.isFunction(options.store)) {
          store = await options.store()
        } else {
          store = await options.store
        }

        const runtime = createRuntime({
          modules,
          store,
          maxWakeIterations: options.maxWakeIterations,
          snapshotEvery: options.snapshotEvery,
          snapshotStore: options.snapshotStore ?? snapshotStoreOf(store),
          trimAfterSnapshot: options.trimAfterSnapshot,
          runCacheSize: options.runCacheSize,
          scheduler: options.scheduler,
        })

        if (options.rescanTimers !== false) {
          await Effect.runPromise(
            Effect.provideService(runtime.rescanTimers(), EventStoreTag, store),
          ).catch((err) => {
            console.error('[rescan timers error]', err)
          })
        }

        const fetchHandler = createFetchHandler({ runtime, store })
        return { runtime, store, snapshotStore: snapshotStoreOf(store), fetchHandler }
      })()
    }

    return initPromise
  }

  const runEffect = async <A>(
    fn: (init: Initialized) => Effect.Effect<A, Error, EventStoreTag>,
  ): Promise<A> => {
    const init = await getInit()
    let provided = Effect.provideService(fn(init), EventStoreTag, init.store)

    if (init.snapshotStore) {
      provided = Effect.provideService(provided, SnapshotStoreTag, init.snapshotStore)
    }

    return Effect.runPromise(provided)
  }

  const looms: Looms = {
    get runtime() {
      return getInit().then((i) => i.runtime)
    },
    get store() {
      return getInit().then((i) => i.store)
    },
    ready: async () => {
      const init = await getInit()
      return { store: init.store, runtime: init.runtime }
    },
    startRun: (args) => runEffect((i) => i.runtime.startRun(args)),
    start: (definition, input, startOpts) =>
      runEffect((i) =>
        i.runtime.startRun({
          kind: definition.kind,
          definitionName: definition.name,
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
    rescanTimers: () => runEffect((i) => i.runtime.rescanTimers()),
    project: (runId, definition) => runEffect((i) => i.runtime.project(runId, definition)),
    replayTo: (runId, seq) => runEffect((i) => i.runtime.replayTo(runId, seq)),
    cancel: (runId, threadId) => runEffect((i) => i.runtime.cancel(runId, threadId)),
    fetch: async (req) => {
      if (!isLoomsApiPath(new URL(req.url).pathname)) {
        return null
      }

      const { fetchHandler } = await getInit()
      return fetchHandler(req)
    },
    serve: (serveOpts) => {
      if (runningServer) {
        return runningServer
      }

      runningServer = serveHttp((req) => looms.fetch(req), serveOpts)
      return runningServer
    },
    stop: async () => {
      if (runningServer) {
        runningServer.stop()
        runningServer = undefined
      }

      if (initPromise) {
        const init = await initPromise
        init.runtime.dispose()
      }
    },
  }

  if (options.serve) {
    looms.serve(options.serve === true ? {} : options.serve)
  }

  return looms
}
