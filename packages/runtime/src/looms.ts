import {
  llmFromAdapter,
  LlmTag,
  StubLlmLive,
  type LlmAdapter,
  type StubLlmPolicy,
} from '@looms/agent'
import {
  EventStoreTag,
  makeMemoryEventStore,
  type ActorState,
  type AgentDefinition,
  type AnyDefinition,
  type EventStore,
  type JsonValue,
  type Message,
  type LoomsEvent,
  type LoomsEventSignal,
  type WorkflowDefinition,
} from '@looms/core'
import { withProjectors, type Projector, type ProjectorErrorHandler } from '@looms/projectors'
import { Effect, Layer, Predicate } from 'effect'
import { createRegistry } from './registry'
import { createLoomsRuntime, type LoomsRuntime } from './runtime'
import {
  createFetchHandler,
  isLoomsApiPath,
  serveHttp,
  type RunningServer,
} from './server'

export interface CreateLoomsOptions {
  readonly definitions?: ReadonlyArray<AnyDefinition>
  readonly store?: EventStore | Promise<EventStore> | (() => Promise<EventStore>)
  readonly llm?: LlmAdapter
  readonly llmPolicy?: StubLlmPolicy
  readonly serve?: boolean | { port?: number; hostname?: string }
  readonly projectors?: ReadonlyArray<Projector>
  readonly onProjectorError?: ProjectorErrorHandler
}

export interface Looms {
  readonly definitions: ReadonlyArray<AnyDefinition>
  ready(): Promise<{ store: EventStore; runtime: LoomsRuntime }>
  startAgent<TInput = JsonValue, TOutput extends JsonValue = JsonValue>(
    definition: AgentDefinition<string, TInput, TOutput>,
    input: TInput,
    options?: { actorId?: string },
  ): Promise<{ actorId: string; state: ActorState; output: TOutput | null }>
  startAgent(
    definitionName: string,
    input?: JsonValue,
    options?: { actorId?: string },
  ): Promise<{ actorId: string; state: ActorState; output: JsonValue | null }>

  startWorkflow<TInput = JsonValue, TOutput extends JsonValue = JsonValue>(
    definition: WorkflowDefinition<string, TInput, TOutput>,
    input: TInput,
    options?: { actorId?: string },
  ): Promise<{ actorId: string; state: ActorState; output: TOutput | null }>
  startWorkflow(
    definitionName: string,
    input?: JsonValue,
    options?: { actorId?: string },
  ): Promise<{ actorId: string; state: ActorState; output: JsonValue | null }>

  getState(actorId: string): Promise<ActorState>
  getEvents(
    actorId: string,
    options?: { fromSeq?: number; limit?: number },
  ): Promise<LoomsEvent[]>
  sendMessage(actorId: string, message: string | Message): Promise<ActorState>
  decideReview(
    actorId: string,
    reviewId: string,
    decision: { actionId: string; outcome: 'approve' | 'reject'; payload?: JsonValue },
  ): Promise<ActorState>
  steer(
    actorId: string,
    message: string | Message,
    options?: { interrupt?: boolean; turn?: number },
  ): Promise<ActorState>
  signal(actorId: string, events: ReadonlyArray<LoomsEventSignal>): Promise<ActorState>
  wake(actorId: string): Promise<ActorState>

  fetch(req: Request): Promise<Response | null>
  serve(options?: { port?: number; hostname?: string }): RunningServer
  stop(): Promise<void>

  readonly runtime: Promise<LoomsRuntime>
  readonly store: Promise<EventStore>
}

interface Initialized {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  readonly provide: <A, E>(effect: Effect.Effect<A, E, LlmTag>) => Effect.Effect<A, E>
  readonly fetchHandler: (req: Request) => Promise<Response | null>
  readonly projectors: ReadonlyArray<Projector>
}

export function createLooms(options: CreateLoomsOptions = {}): Looms {
  const definitions = options.definitions ? [...options.definitions] : []
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

        const projectors = options.projectors ?? []
        await Promise.all(projectors.map((projector) => projector.init?.() ?? Promise.resolve()))
        if (projectors.length > 0) {
          store = withProjectors(store, projectors, { onError: options.onProjectorError })
        }

        let llmLayer: Layer.Layer<LlmTag>
        if (options.llm) {
          llmLayer = Layer.succeed(LlmTag, llmFromAdapter(options.llm))
        } else {
          llmLayer = StubLlmLive(options.llmPolicy)
        }

        const registry = createRegistry(definitions)
        const runtime = createLoomsRuntime(registry)
        const provide = <A, E>(effect: Effect.Effect<A, E, LlmTag>) =>
          Effect.provide(effect, llmLayer)
        const fetchHandler = createFetchHandler({ runtime, store, provide })

        return { runtime, store, provide, fetchHandler, projectors }
      })()
    }
    return initPromise
  }

  const runEffect = async <A>(
    fn: (init: Initialized) => Effect.Effect<A, Error, EventStoreTag | LlmTag>,
  ): Promise<A> => {
    const init = await getInit()
    const withStore = Effect.provideService(fn(init), EventStoreTag, init.store)
    return Effect.runPromise(init.provide(withStore))
  }

  const looms: Looms = {
    definitions,

    ready: async () => {
      const init = await getInit()
      return { store: init.store, runtime: init.runtime }
    },

    get runtime() {
      return getInit().then((i) => i.runtime)
    },

    get store() {
      return getInit().then((i) => i.store)
    },

    startAgent: async (defOrName: any, input?: any, opts?: { actorId?: string }) => {
      const init = await getInit()
      const defName: string = Predicate.isString(defOrName) ? defOrName : defOrName.name
      if (!init.runtime.registry.agents.has(defName)) {
        throw new Error(
          `Unknown agent: "${defName}". Registered agents: ${[...init.runtime.registry.agents.keys()].join(', ')}`,
        )
      }

      const result = await runEffect((i) =>
        i.runtime.startAgent(defName, input ?? null, opts),
      )
      // SAFETY: actor outcome and state match the startAgent return signature.
      return {
        actorId: result.actorId,
        state: result.state,
        output: result.state.output,
      } as any
    },

    startWorkflow: async (defOrName: any, input?: any, opts?: { actorId?: string }) => {
      const init = await getInit()
      const defName: string = Predicate.isString(defOrName) ? defOrName : defOrName.name
      if (!init.runtime.registry.workflows.has(defName)) {
        throw new Error(
          `Unknown workflow: "${defName}". Registered workflows: ${[...init.runtime.registry.workflows.keys()].join(', ')}`,
        )
      }

      const result = await runEffect((i) =>
        i.runtime.startWorkflow(defName, input ?? null, opts),
      )
      // SAFETY: workflow outcome and state match the startWorkflow return signature.
      return {
        actorId: result.actorId,
        state: result.state,
        output: result.state.output,
      } as any
    },

    getState: (actorId) => runEffect((i) => i.runtime.getState(actorId)),

    getEvents: (actorId, opts) => runEffect((i) => i.runtime.getEvents(actorId, opts)),

    sendMessage: (actorId, message) => {
      const msg: Message = Predicate.isString(message)
        ? { role: 'user', content: message }
        : message
      return runEffect((i) =>
        i.runtime.signal(actorId, [
          {
            type: 'agent.message.received',
            payload: { message: msg },
          },
        ]),
      )
    },

    decideReview: (actorId, reviewId, decision) =>
      runEffect((i) => i.runtime.decideReview(actorId, reviewId, decision)),

    steer: (actorId, message, opts) =>
      runEffect((i) => i.runtime.steer(actorId, message, opts)),

    signal: (actorId, events) => runEffect((i) => i.runtime.signal(actorId, events)),

    wake: (actorId) => runEffect((i) => i.runtime.wake(actorId)),

    fetch: async (req: Request) => {
      if (!isLoomsApiPath(new URL(req.url).pathname)) {
        return null
      }
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
      if (initPromise) {
        const init = await initPromise
        await Promise.all(init.projectors.map((projector) => projector.dispose?.() ?? Promise.resolve()))
      }
    },
  }

  if (options.serve) {
    const serveOpts = options.serve === true ? {} : options.serve
    looms.serve(serveOpts)
  }

  return looms
}
