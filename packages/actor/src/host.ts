import { Data, Effect } from 'effect'

import type {
  AnyRuntimeModule,
  EventInput,
  EventStore,
  EventStoreTrimCoverage,
  RunLauncher,
  RunState,
  SnapshotStore,
} from '@looms/core'
import { createRemoteRunLauncher, EventStoreTag } from '@looms/core'
import {
  createTimeoutScheduler,
  isLoomsApiPath,
  type Authorize,
  type StartResult,
  type StartRunArgs,
} from '@looms/runtime'

import { createActorCell, type ActorCell } from './cell'
import { crossRunResponse, definitionsResponse, resolveRunTarget, RunTargetError } from './routing'

class ActorWakeError extends Data.TaggedError('ActorWakeError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'ActorWakeError'
  }
}

class ActorHostError extends Data.TaggedError('ActorHostError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'ActorHostError'
  }
}

export interface LocalActorHostOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly createStore: (runId: string) => EventStore | Promise<EventStore>
  readonly modules: TModules
  readonly snapshotStore?: SnapshotStore
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly trimAfterSnapshot?: {
    readonly keepSnapshots: number
    readonly coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
  /**
   * After creating a cell, rescan its store for pending timers (process restart).
   * Default true. No-op for empty in-memory stores.
   */
  readonly rescanTimers?: boolean
  /** Authorizes each cell's HTTP API; see `createFetchHandler`. */
  readonly authorize?: Authorize
}

export interface LocalActorHost<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  getCell(runId: string): Promise<ActorCell<TModules>>
  readonly launcher: RunLauncher
  startRun(args: StartRunArgs): Promise<StartResult>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string },
  ): Promise<RunState>
  getRun(runId: string): Promise<RunState>
  fetch(req: Request): Promise<Response | null>
  dispose(): Promise<void>
}

/**
 * Creates an in-process host that routes requests to distinct actor cells.
 * Useful for local Bun actor backends, tests, and lightweight simulation.
 */
export function createLocalActorHost<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
>(options: LocalActorHostOptions<TModules>): LocalActorHost<TModules> {
  const cells = new Map<string, Promise<ActorCell<TModules>>>()
  const rescanTimers = options.rescanTimers !== false

  let getCell: (runId: string) => Promise<ActorCell<TModules>>

  const launcher = createRemoteRunLauncher({
    launch: (runId, args) => getCell(runId).then((cell) => cell.launch(args)),
    status: (runId) => getCell(runId).then((cell) => cell.status()),
  })

  getCell = (runId: string): Promise<ActorCell<TModules>> => {
    const existing = cells.get(runId)

    if (existing) {
      return existing
    }

    const cellPromise = Effect.runPromise(
      Effect.gen(function* () {
        const store = yield* Effect.tryPromise({
          try: () => Promise.resolve(options.createStore(runId)),
          catch: (cause) => new ActorHostError(cause),
        })

        // Assign after createActorCell so the scheduler never closes over an unassigned cell.
        let wake: (() => Promise<RunState>) | undefined

        const scheduler = createTimeoutScheduler((scheduledRunId) =>
          scheduledRunId === runId && wake
            ? Effect.tryPromise({
                try: wake,
                catch: (cause) => new ActorWakeError(cause),
              }).pipe(Effect.tapError(Effect.logError), Effect.ignore)
            : Effect.void,
        )

        const cell = createActorCell({
          runId,
          store,
          scheduler,
          modules: options.modules,
          snapshotStore: options.snapshotStore,
          snapshotEvery: options.snapshotEvery,
          maxWakeIterations: options.maxWakeIterations,
          trimAfterSnapshot: options.trimAfterSnapshot,
          authorize: options.authorize,
          launcher,
        })

        wake = () => cell.wake()

        if (rescanTimers) {
          yield* Effect.provideService(cell.runtime.rescanTimers, EventStoreTag, store).pipe(
            Effect.tapError(Effect.logError),
            Effect.ignore,
          )
        }

        return cell
      }),
    )

    cells.set(runId, cellPromise)
    return cellPromise
  }

  return {
    getCell,
    launcher,
    startRun: (args) => {
      const runId = args.runId

      if (!runId) {
        return Promise.reject(new Error('LocalActorHost.startRun requires runId'))
      }

      return getCell(runId).then((cell) => cell.startRun(args))
    },
    signal: (runId, events, signalOptions) =>
      getCell(runId).then((cell) => cell.signal(events, signalOptions)),
    getRun: (runId) => getCell(runId).then((cell) => cell.getRun()),

    fetch: (req: Request): Promise<Response | null> => {
      const url = new URL(req.url)

      if (!isLoomsApiPath(url.pathname)) {
        return Promise.resolve(null)
      }

      if (url.pathname === '/health') {
        return Promise.resolve(Response.json({ ok: true }))
      }

      const definitions = definitionsResponse(req, options.modules)

      if (definitions) {
        return Promise.resolve(definitions)
      }

      const unsupported = crossRunResponse(req, 'the actor host')

      if (unsupported) {
        return Promise.resolve(unsupported)
      }

      return Effect.runPromise(
        Effect.gen(function* () {
          const { runId, request } = yield* Effect.tryPromise({
            try: () => resolveRunTarget(req),
            catch: (cause) => new ActorHostError(cause),
          })

          const cell = yield* Effect.tryPromise({
            try: () => getCell(runId),
            catch: (cause) => new ActorHostError(cause),
          })

          return yield* Effect.tryPromise({
            try: () => cell.fetch(request),
            catch: (cause) => new ActorHostError(cause),
          })
        }).pipe(
          Effect.catchIf(
            (error) => error.cause instanceof RunTargetError,
            () => Effect.succeed(new Response('Not Found', { status: 404 })),
          ),
        ),
      )
    },

    dispose: () => {
      const disposals = [...cells.values()].map((promise) => promise.then((cell) => cell.dispose()))
      cells.clear()

      return Promise.all(disposals).then(() => undefined)
    },
  }
}
