import type { Effect } from 'effect'

import type {
  AnyRuntimeModule,
  ComposedRegistry,
  EventEnvelope,
  EventInput,
  WorkerCallbackInput,
  EventStore,
  EventStoreAppendError,
  EventStoreError,
  EventStoreFencedError,
  EventStoreTag,
  EventStoreTrimCoverage,
  RunLauncher,
  RunLaunchSource,
  EventStoreTruncationError,
  JsonValue,
  ProjectionDefinition,
  ReplayStep,
  RunState,
  RunSummary,
  SnapshotStore,
  SnapshotStoreError,
} from '@looms/core'
import type { EventStoreTrimmedError } from '@looms/core'

import type { DuplicateEffectDispatchError, MaxWakeIterationsError } from './errors'
import type { RuntimeObserver } from './observer'
import type { WakeScheduler } from './wake-scheduler'

export type WakeError =
  | DuplicateEffectDispatchError
  | MaxWakeIterationsError
  | EventStoreTruncationError
  | EventStoreTrimmedError
  | EventStoreFencedError
  | EventStoreError
  | Error

export interface CreateRuntimeOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly modules: TModules
  readonly store?: EventStore
  /**
   * Durable events between mid-wake snapshots. Default 200; `0` disables.
   * A snapshot is always taken when a wake parks, so this only bounds replay
   * after a crash inside one long wake.
   */
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  /** Maximum concurrent in-flight worker effects dispatched per run (fairness guard). */
  readonly maxInFlightWorkerEffects?: number
  /** Maximum active and queued mutation operations per run. Default 256. */
  readonly maxPendingRunOperations?: number
  /** Defaults to the EventStore's attached store or an in-memory SnapshotStore. */
  readonly snapshotStore?: SnapshotStore
  /** Trim the event log behind the oldest kept snapshot. Also sets how many snapshots to keep. */
  readonly trimAfterSnapshot?: {
    keepSnapshots: number
    /**
     * Required proof that history remains rebuildable. Trimming is rejected
     * unless an archive covers the cut or every configured projector checkpoint does.
     */
    coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
  /**
   * Cursors to keep in process between calls. Default `0`: every call starts
   * from the store (snapshot + delta). A cached cursor is validated against
   * `store.tail` before use.
   */
  readonly runCacheSize?: number
  /**
   * Pluggable wake scheduler for timer waits.
   * Defaults to an in-process Effect fiber scheduler.
   */
  readonly scheduler?: WakeScheduler
  /**
   * Starts runs from effect handlers. Required for schedules on an actor or Durable Object host.
   * Single-store `createLooms` installs one that launches into its own store.
   */
  readonly launcher?: RunLauncher
  /** Install a launcher that starts runs in this runtime's store. `createLooms` sets this. */
  readonly localLauncher?: boolean
  readonly worker?: EffectWorker
  /** Failure-isolated, framework-neutral operational event sink. */
  readonly observer?: RuntimeObserver
}

export interface EffectWorkerTask {
  readonly runId: string
  readonly effectId: string
  readonly attempt: number
  readonly type: string
  readonly input: JsonValue
}

export interface EffectWorker {
  /** Effect types this worker claims, even when a local handler exists. */
  readonly handles?: ReadonlyArray<string> | ((type: string) => boolean)
  /** Per-task claim, checked with attempt 0 before the runtime assigns an attempt. */
  readonly canDispatch?: (task: EffectWorkerTask) => boolean
  dispatch(task: EffectWorkerTask): void | Promise<void>
  cancel?(task: EffectWorkerTask): void | Promise<void>
  /**
   * Dispatch semantics:
   * - 'unacknowledged' (default): failed dispatch is treated as ambiguous (wait for schedule-to-start or operator).
   * - 'acknowledged': resolved send means enqueued, thrown error means not enqueued (retryable dispatch with backoff).
   */
  readonly dispatchSemantics?: 'unacknowledged' | 'acknowledged'
}

export interface StartRunArgs {
  kind: string
  definitionName: string
  definitionVersion?: string
  input?: JsonValue
  runId?: string
  threadId?: string
  idempotencyKey?: string
  /** The effect that launched this run. The runtime sets it on launches made from effects. */
  launchedBy?: RunLaunchSource
  /** Recorded on `runtime.run.started` to group related runs. */
  correlationId?: string
}

export interface StartResult {
  runId: string
  threadId: string
  state: RunState
}

export interface RunOperationalStatus {
  readonly runId: string
  readonly state: RunState
  readonly head: number
  readonly tail: number
  readonly effects: ReadonlyArray<{
    readonly effectId: string
    readonly threadId: string
    readonly type: string
    readonly attempt: number
    readonly status: string
    readonly deadlineAt: number | null
    readonly lastError: string | null
  }>
}

export interface LoomsRuntime<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly modules: TModules
  readonly registry: ComposedRegistry
  startRun(
    args: StartRunArgs,
  ): Effect.Effect<StartResult, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  /**
   * Commit a run's start, then schedule a wake instead of waiting for it. A duplicate start with
   * the same identity is a no-op aside from the scheduled wake.
   */
  launchRun(
    args: StartRunArgs,
  ): Effect.Effect<StartResult, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string },
  ): Effect.Effect<RunState, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  wake(runId: string): Effect.Effect<RunState, WakeError, EventStoreTag>
  getRun(
    runId: string,
  ): Effect.Effect<
    RunState,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError,
    EventStoreTag
  >
  getEvents(
    runId: string,
    options?: { fromSeq?: number; limit?: number },
  ): Effect.Effect<EventEnvelope[], EventStoreError, EventStoreTag>
  project<S>(
    runId: string,
    definition: ProjectionDefinition<S>,
  ): Effect.Effect<S, EventStoreError, EventStoreTag>
  replayTo(
    runId: string,
    seq: number,
  ): Effect.Effect<ReplayStep | null, EventStoreError, EventStoreTag>
  inspectRun(
    runId: string,
  ): Effect.Effect<
    RunOperationalStatus,
    EventStoreError | EventStoreTrimmedError | EventStoreTruncationError,
    EventStoreTag
  >
  retryEffect(
    runId: string,
    effectId: string,
  ): Effect.Effect<RunState, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  cancel(
    runId: string,
    threadId?: string,
  ): Effect.Effect<RunState, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  /**
   * Start a new run that continues where a finished run ended. The fork copies the source's
   * history up to the point it finished and re-issues the effects outstanding there. Retrying
   * with the same `runId` returns the existing fork.
   */
  fork(
    sourceRunId: string,
    options?: { runId?: string },
  ): Effect.Effect<StartResult, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  /** Applies a worker's report about one effect attempt; stale or foreign reports are ignored. */
  workerCallback(
    runId: string,
    input: WorkerCallbackInput,
  ): Effect.Effect<RunState, Error | EventStoreAppendError | EventStoreError, EventStoreTag>
  readonly listRuns: Effect.Effect<string[], EventStoreError, EventStoreTag>
  /** Indexed run rows. Folds a run only when its header has not been written yet. */
  readonly listRunSummaries: Effect.Effect<
    readonly RunSummary[],
    EventStoreError | EventStoreTrimmedError | EventStoreTruncationError | SnapshotStoreError,
    EventStoreTag
  >
  readonly rescanTimers: Effect.Effect<
    number,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError,
    EventStoreTag
  >
  /** Reschedule every durable timer and effect deadline after restart or repair. */
  readonly recoverDeadlines: Effect.Effect<
    number,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError,
    EventStoreTag
  >
  readonly dispose: Effect.Effect<void>
}
