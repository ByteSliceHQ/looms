import { Effect } from 'effect'

import {
  EventStoreTag,
  type AnyRuntimeModule,
  type DefinitionResolver,
  type EventInput,
  type EventStore,
  type EventStoreTrimCoverage,
  type LaunchRunArgs,
  type RunLauncher,
  type RunState,
  type RunStatusSnapshot,
  type SnapshotStore,
} from '@looms/core'
import {
  createFetchHandler,
  createRuntime,
  StartRunConflictError,
  type Authorize,
  type LoomsRuntime,
  type StartResult,
  type StartRunArgs,
  type WakeScheduler,
} from '@looms/runtime'

import { runIdFromRequest } from './routing'

export interface ActorCellOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly runId: string
  readonly store: EventStore
  readonly scheduler?: WakeScheduler
  readonly modules: TModules
  /** Loads definitions that were not registered on a module. See `CreateRuntimeOptions`. */
  readonly definitionResolver?: DefinitionResolver
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly maxPendingRunOperations?: number
  readonly snapshotStore?: SnapshotStore
  readonly trimAfterSnapshot?: {
    readonly keepSnapshots: number
    readonly coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
  /** Authorizes the cell's HTTP API; see `createFetchHandler`. */
  readonly authorize?: Authorize
  /** Starts runs from effect handlers. Required for schedules; there is no default inside a cell. */
  readonly launcher?: RunLauncher
}

export interface ActorCell<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly runId: string
  readonly runtime: LoomsRuntime<TModules>
  readonly store: EventStore
  fetch(req: Request): Promise<Response>
  wake(): Promise<RunState>
  recoverWake(): Promise<number>
  dispose(): Promise<void>
  /** Commit this cell's run and schedule a wake. A conflicting restart is a no-op. */
  launch(args: LaunchRunArgs): Promise<void>
  status(): Promise<RunStatusSnapshot | null>
  startRun(args: StartRunArgs): Promise<StartResult>
  signal(
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string; coalesce?: boolean },
  ): Promise<RunState>
  /** Append runtime-originated events. Not the client signal path. */
  accept(
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string; coalesce?: boolean },
  ): Promise<RunState>
  cancel(): Promise<void>
  getRun(): Promise<RunState>
}

/**
 * Creates an in-process actor cell that owns a single `runId`.
 * Encapsulates single-writer concurrency, local storage, and HTTP routing.
 */
export function createActorCell<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
>(options: ActorCellOptions<TModules>): ActorCell<TModules> {
  const { runId, store, scheduler } = options

  const runtime = createRuntime({
    modules: options.modules,
    definitionResolver: options.definitionResolver,
    store,
    scheduler,
    launcher: options.launcher,
    snapshotEvery: options.snapshotEvery,
    maxWakeIterations: options.maxWakeIterations,
    maxPendingRunOperations: options.maxPendingRunOperations,
    snapshotStore: options.snapshotStore,
    trimAfterSnapshot: options.trimAfterSnapshot,
  })

  const provide = <A, E>(effect: Effect.Effect<A, E, EventStoreTag>) =>
    Effect.runPromise(Effect.provideService(effect, EventStoreTag, store))

  const fetchHandler = createFetchHandler({ runtime, store, authorize: options.authorize })

  return {
    runId,
    runtime,
    store,

    fetch: (req: Request) => {
      const targetRunId = runIdFromRequest(req)

      if (targetRunId && targetRunId !== runId) {
        return Promise.resolve(new Response('Not Found', { status: 404 }))
      }

      return fetchHandler(req).then((res) => res ?? new Response('Not Found', { status: 404 }))
    },

    wake: () => provide(runtime.wake(runId)),

    recoverWake: () => provide(runtime.rescanTimers),

    dispose: () => Effect.runPromise(runtime.dispose),

    launch: (args) =>
      provide(
        runtime.launchRun({ ...args, runId }).pipe(
          Effect.catchIf(
            (error) => error instanceof StartRunConflictError,
            () => Effect.void,
          ),
          Effect.asVoid,
        ),
      ),

    status: () =>
      provide(
        runtime
          .getRun(runId)
          .pipe(
            Effect.map((state) => (state.rootThreadId === null ? null : { status: state.status })),
          ),
      ),

    startRun: (args) => provide(runtime.startRun({ ...args, runId })),

    signal: (events, signalOptions) => provide(runtime.signal(runId, events, signalOptions)),

    accept: (events, signalOptions) => provide(runtime.accept(runId, events, signalOptions)),

    cancel: () => provide(runtime.cancel(runId).pipe(Effect.asVoid)),

    getRun: () => provide(runtime.getRun(runId)),
  }
}
