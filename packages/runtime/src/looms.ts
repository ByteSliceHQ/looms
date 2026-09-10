import { Effect, Predicate } from 'effect'

import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import {
  EventStoreTag,
  makeMemoryEventStore,
  type AnyRuntimeModule,
  type DefinitionInput,
  type DefinitionRef,
  type EventEnvelope,
  type EventInput,
  type EventStore,
  type JsonValue,
  type ProjectionDefinition,
  type RegisteredDefinition,
  type ReplayStep,
  type RunState,
} from '@looms/core'
import { workflow } from '@looms/workflow'

import { createRuntime, type LoomsRuntime } from './runtime'
import { createFetchHandler, isLoomsApiPath, serveHttp, type RunningServer } from './server'

export interface CreateLoomsOptions {
  /** Anything with `{ kind, name }`: agents, workflows, or definitions from your own modules. */
  readonly definitions?: ReadonlyArray<DefinitionRef>
  /** Defaults to `[agent(), workflow(), approval()]`. Pass your own list to add or swap modules. */
  readonly modules?: readonly AnyRuntimeModule[]
  readonly store?: EventStore | Promise<EventStore> | (() => Promise<EventStore>)
  readonly serve?: boolean | { port?: number; hostname?: string }
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
  ): Promise<StartResult>
  /** Start a run by `{ kind, definitionName }` when you only have names (HTTP bodies, CLIs). */
  startRun(args: {
    kind: string
    definitionName: string
    input?: JsonValue
    runId?: string
  }): Promise<StartResult>
  getRun(runId: string): Promise<RunState>
  getEvents(runId: string, options?: { fromSeq?: number; limit?: number }): Promise<EventEnvelope[]>
  signal(runId: string, events: ReadonlyArray<EventInput>): Promise<RunState>
  wake(runId: string): Promise<RunState>
  project<S>(runId: string, definition: ProjectionDefinition<S>): Promise<S>
  replayTo(runId: string, seq: number): Promise<ReplayStep | null>
  fetch(req: Request): Promise<Response | null>
  serve(options?: { port?: number; hostname?: string }): RunningServer
  stop(): Promise<void>
}

interface Initialized {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  readonly fetchHandler: (req: Request) => Promise<Response | null>
}

function toRegistered(definitions: ReadonlyArray<DefinitionRef>): RegisteredDefinition[] {
  return definitions.map((def) => ({
    kind: def.kind,
    name: def.name,
    input: def.input,
    value: def,
  }))
}

export function createLooms(options: CreateLoomsOptions = {}): Looms {
  const definitions = options.definitions ? [...options.definitions] : []
  const modules = options.modules ?? [agent(), workflow(), approval()]
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
          definitions: toRegistered(definitions),
        })
        const fetchHandler = createFetchHandler({ runtime, store })
        return { runtime, store, fetchHandler }
      })()
    }
    return initPromise
  }

  const runEffect = async <A>(
    fn: (init: Initialized) => Effect.Effect<A, Error, EventStoreTag>,
  ): Promise<A> => {
    const init = await getInit()
    return Effect.runPromise(Effect.provideService(fn(init), EventStoreTag, init.store))
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
    start: (definition, input) =>
      runEffect((i) =>
        i.runtime.startRun({
          kind: definition.kind,
          definitionName: definition.name,
          // SAFETY: input is validated against the definition's schema inside startRun.
          input: input as JsonValue | undefined,
        }),
      ),
    getRun: (runId) => runEffect((i) => i.runtime.getRun(runId)),
    getEvents: (runId, opts) => runEffect((i) => i.runtime.getEvents(runId, opts)),
    signal: (runId, events) => runEffect((i) => i.runtime.signal(runId, events)),
    wake: (runId) => runEffect((i) => i.runtime.wake(runId)),
    project: (runId, definition) => runEffect((i) => i.runtime.project(runId, definition)),
    replayTo: (runId, seq) => runEffect((i) => i.runtime.replayTo(runId, seq)),
    fetch: async (req) => {
      if (!isLoomsApiPath(new URL(req.url).pathname)) return null
      const { fetchHandler } = await getInit()
      return fetchHandler(req)
    },
    serve: (serveOpts) => {
      if (runningServer) return runningServer
      runningServer = serveHttp((req) => looms.fetch(req), serveOpts)
      return runningServer
    },
    stop: async () => {
      if (runningServer) {
        runningServer.stop()
        runningServer = undefined
      }
    },
  }

  if (options.serve) {
    looms.serve(options.serve === true ? {} : options.serve)
  }

  return looms
}
