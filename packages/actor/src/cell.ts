import { Data, Effect } from 'effect'

import {
  EventStoreTag,
  cleanUndefined,
  type AnyRuntimeModule,
  type DefinitionResolver,
  type EventInput,
  type EventStore,
  type EventStoreTrimCoverage,
  type JsonValue,
  type LaunchRunArgs,
  type ProjectionDefinition,
  type RunAttributeFields,
  type RunLauncher,
  type RunState,
  type RunStatusSnapshot,
  type SnapshotStore,
  type LoomsIds,
} from '@looms/core'
import {
  createFetchHandler,
  createRuntime,
  StartRunConflictError,
  type Authorize,
  type EffectWorker,
  type LoomsRuntime,
  type RunSignalOptions,
  type StartResult,
  type StartRunArgs,
  type WakeScheduler,
  type RuntimeObserver,
  type SecretProvider,
  type SecretSealer,
} from '@looms/runtime'

import { runIdFromRequest } from './routing'

/** A projection was read by a name no module registered. */
export class UnknownProjectionError extends Data.TaggedError('UnknownProjectionError')<{
  readonly projection: string
  readonly message: string
}> {
  constructor(projection: string) {
    super({ projection, message: `Unknown projection: ${projection}` })
  }
}

export interface ActorCellOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly runId: string
  readonly store: EventStore
  readonly scheduler?: WakeScheduler
  readonly modules: TModules
  /** Loads definitions that were not registered on a module. See `CreateRuntimeOptions`. */
  readonly definitionResolver?: DefinitionResolver
  /** The id format. See `CreateRuntimeOptions.ids`. */
  readonly ids?: LoomsIds
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  /** See `CreateRuntimeOptions.livenessLeaseMs`. */
  readonly livenessLeaseMs?: number
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
  /**
   * Dispatches worker-placed effects out of the cell (for example a
   * Cloudflare Queue producer). Without it, worker effects cannot leave the object.
   */
  readonly worker?: EffectWorker
  /** Declared run attributes. See `CreateRuntimeOptions`. */
  readonly attributes?: RunAttributeFields
  /** Told about wakes, appends, snapshots and effect attempts. See `CreateRuntimeOptions`. */
  readonly observer?: RuntimeObserver
  /** Decides what a run holds and what each attempt receives. See `CreateRuntimeOptions`. */
  readonly secretProvider?: SecretProvider
  /** Encrypts what a run holds before it is stored. See `secretSealer`. */
  readonly secretSealer?: SecretSealer
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
  signal(events: ReadonlyArray<EventInput>, options?: RunSignalOptions): Promise<RunState>
  /** Append runtime-originated events. Not the client signal path. */
  accept(events: ReadonlyArray<EventInput>, options?: RunSignalOptions): Promise<RunState>
  cancel(): Promise<void>
  getRun(): Promise<RunState>
  /**
   * Fold a registered projection over this cell's run, typed by its definition. Rejects with
   * {@link UnknownProjectionError} when no module registered a projection of that name.
   */
  project<S>(definition: ProjectionDefinition<S>): Promise<S>
  /** The same, by the projection's registered name, as JSON. For callers across a boundary. */
  projection(name: string): Promise<JsonValue>
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
    ids: options.ids,
    store,
    scheduler,
    launcher: options.launcher,
    worker: options.worker,
    snapshotEvery: options.snapshotEvery,
    maxWakeIterations: options.maxWakeIterations,
    livenessLeaseMs: options.livenessLeaseMs,
    maxPendingRunOperations: options.maxPendingRunOperations,
    snapshotStore: options.snapshotStore,
    trimAfterSnapshot: options.trimAfterSnapshot,
    attributes: options.attributes,
    observer: options.observer,
    secretProvider: options.secretProvider,
    secretSealer: options.secretSealer,
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

    project: (definition) =>
      runtime.registry.projections.has(definition.name)
        ? provide(runtime.project(runId, definition))
        : Promise.reject(new UnknownProjectionError(definition.name)),

    projection: (name) => {
      const definition = runtime.registry.projections.get(name)

      return definition
        ? provide(runtime.project(runId, definition).pipe(Effect.map(cleanUndefined)))
        : Promise.reject(new UnknownProjectionError(name))
    },
  }
}
