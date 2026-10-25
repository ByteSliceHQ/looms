import { DurableObject } from 'cloudflare:workers'
import { Effect } from 'effect'

import { createActorCell, type ActorCell } from '@looms/actor'
import {
  createRemoteRunLauncher,
  type AnyRuntimeModule,
  type DefinitionResolver,
  type EventInput,
  type BlobStore,
  type EventStoreTrimCoverage,
  type LaunchRunArgs,
  type RunLauncher,
  type RunState,
  type RunStatusSnapshot,
} from '@looms/core'
import type { Projector } from '@looms/projectors'
import {
  defaultAuthorize,
  type Authorize,
  type EffectWorker,
  type LoomsRuntime,
  type StartResult,
  type StartRunArgs,
} from '@looms/runtime'

import { durableObjectAlarms } from './alarm-scheduler'
import { durableObjectEventStore, type DurableObjectEventStore } from './event-store'
import type { DurableObjectNamespaceLike } from './router'
import { attachSocketFanout, isRunSocketUpgrade, openRunSocket } from './websocket'

export interface LoomsDurableObjectConfig {
  readonly modules: readonly AnyRuntimeModule[]
  /** Loads definitions that were not registered on a module. See `CreateRuntimeOptions`. */
  readonly definitionResolver?: DefinitionResolver
  readonly projectors?: readonly Projector[]
  /** Content-addressed store for event and snapshot JSON over the inline byte limits. */
  readonly blobs?: BlobStore
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly maxPendingRunOperations?: number
  readonly trimAfterSnapshot?: {
    readonly keepSnapshots: number
    readonly coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
  /** Authorizes the actor's HTTP API; see `createFetchHandler`. */
  readonly authorize?: Authorize
  /**
   * Starts runs from effect handlers. A schedule object passes `durableObjectLauncher` so fires
   * land in the target's object. Without it, a fire fails instead of writing into this object.
   */
  readonly launcher?: RunLauncher
  /**
   * Dispatches `execution: 'worker'` effects out of this object (typically a
   * Cloudflare Queue producer via `cloudflareQueueWorker`). Without it, worker
   * effects cannot leave the Durable Object.
   */
  readonly worker?: EffectWorker
}

/**
 * Base Durable Object class for hosting a Looms actor cell.
 * Subclasses implement `configure(env)` to supply configured modules.
 * Works identically on Cloudflare Workers and celld.
 */
export abstract class LoomsDurableObject<Env = unknown> extends DurableObject<Env> {
  private cellPromise?: Promise<ActorCell>
  private store?: DurableObjectEventStore
  private authorize: Authorize = defaultAuthorize

  abstract configure(env: Env): LoomsDurableObjectConfig | Promise<LoomsDurableObjectConfig>

  private getCell(): Promise<ActorCell> {
    if (this.cellPromise) {
      return this.cellPromise
    }

    const created = this.createCell()
    this.cellPromise = created

    // A failed setup must not be cached, or every later request and alarm would fail with it.
    created.catch(() => {
      if (this.cellPromise === created) {
        this.cellPromise = undefined
      }
    })

    return created
  }

  private createCell(): Promise<ActorCell> {
    return Promise.resolve(this.configure(this.env)).then((config) => {
      const runId = this.ctx.id.name

      if (!runId) {
        throw new Error(
          'LoomsDurableObject requires a named Durable Object id (use idFromName / getByName)',
        )
      }

      const alarms = durableObjectAlarms(
        this.ctx.storage,
        () =>
          this.store?.projectorDelivery?.nextRetryAt(runId).pipe(Effect.orDie) ??
          Effect.succeed(null),
      )

      const store = durableObjectEventStore(this.ctx, {
        projectors: config.projectors,
        scheduleProjectorRetry: alarms.scheduleAtEarliest,
        blobs: config.blobs,
      })

      this.store = store
      this.authorize = config.authorize ?? defaultAuthorize

      const cell = createActorCell({
        runId,
        store: attachSocketFanout(this.ctx, store, runId),
        scheduler: alarms.scheduler,
        modules: config.modules,
        definitionResolver: config.definitionResolver,
        snapshotEvery: config.snapshotEvery,
        maxWakeIterations: config.maxWakeIterations,
        maxPendingRunOperations: config.maxPendingRunOperations,
        trimAfterSnapshot: config.trimAfterSnapshot,
        authorize: config.authorize,
        launcher: config.launcher,
        worker: config.worker,
      })

      const delivery = store.projectorDelivery

      const recoverProjectors = delivery
        ? Effect.runPromise(delivery.recover(runId).pipe(Effect.andThen(delivery.deliver(runId))))
        : Promise.resolve()

      return recoverProjectors.then(() => cell.recoverWake()).then(() => cell)
    })
  }

  override fetch(req: Request): Promise<Response> {
    if (isRunSocketUpgrade(req)) {
      return this.getCell().then((cell) => this.acceptRunSocket(req, cell.runtime))
    }

    return this.getCell().then((cell) => cell.fetch(req))
  }

  /** Client messages are ignored. Signals and other writes stay on HTTP. */
  override webSocketMessage(): void {
    // A hibernated socket stays quiet. The platform delivers this only if a client writes.
  }

  override webSocketClose(): void {
    // The platform drops the socket. Nothing is retained for it.
  }

  override webSocketError(): void {
    // The platform drops the socket. Nothing is retained for it.
  }

  private acceptRunSocket(req: Request, runtime: LoomsRuntime): Promise<Response> {
    const store = this.store
    const runId = this.ctx.id.name

    if (!store || !runId) {
      return Promise.resolve(Response.json({ error: 'Run is not ready' }, { status: 500 }))
    }

    return Effect.runPromise(
      openRunSocket({
        ctx: this.ctx,
        runtime,
        store,
        request: req,
        runId,
        authorize: this.authorize,
      }),
    )
  }

  /** Commit this object's run and set its alarm. Returns before the run wakes. */
  launch(args: LaunchRunArgs): Promise<void> {
    return this.getCell().then((cell) => cell.launch(args))
  }

  status(): Promise<RunStatusSnapshot | null> {
    return this.getCell().then((cell) => cell.status())
  }

  startRun(args: StartRunArgs): Promise<StartResult> {
    return this.getCell().then((cell) => cell.startRun(args))
  }

  signal(
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string; coalesce?: boolean },
  ): Promise<RunState> {
    return this.getCell().then((cell) => cell.signal(events, options))
  }

  accept(
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string; coalesce?: boolean },
  ): Promise<RunState> {
    return this.getCell().then((cell) => cell.accept(events, options))
  }

  cancel(): Promise<void> {
    return this.getCell().then((cell) => cell.cancel())
  }

  getRun(): Promise<RunState> {
    return this.getCell().then((cell) => cell.getRun())
  }

  /** A rejected alarm is retried by the platform with backoff, so failures just propagate. */
  override alarm(): Promise<void> {
    return this.getCell()
      .then((cell) => {
        const delivery = this.store?.projectorDelivery

        const delivered = delivery
          ? Effect.runPromise(delivery.deliver(this.ctx.id.name ?? ''))
          : Promise.resolve()

        return delivered.then(() => cell.wake())
      })
      .then(() => undefined)
  }
}

export interface DurableObjectRunStub {
  fetch(request: Request): Promise<Response>
  launch(args: LaunchRunArgs): Promise<void>
  status(): Promise<RunStatusSnapshot | null>
  startRun(args: StartRunArgs): Promise<StartResult>
  signal(
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string; coalesce?: boolean },
  ): Promise<RunState>
  accept(
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string; coalesce?: boolean },
  ): Promise<RunState>
  cancel(): Promise<void>
  getRun(): Promise<RunState>
}

/**
 * Launches and reads runs in other Durable Objects. One object per `runId`.
 * The argument is the binding, not the stub, so a class can pass its own namespace
 * without the type checker expanding that class through this function.
 */
export function durableObjectLauncher(namespace: { getByName(name: string): object }): RunLauncher {
  const runs = loomsNamespace(namespace)

  return createRemoteRunLauncher({
    launch: (runId, args) => runs.getByName(runId).launch(args),
    status: (runId) => runs.getByName(runId).status(),
    accept: (runId, events, options) =>
      runs
        .getByName(runId)
        .accept(events, options)
        .then(() => undefined),
    cancel: (runId) => runs.getByName(runId).cancel(),
  })
}

export interface DurableObjectScheduleHost {
  startRun(args: StartRunArgs): Promise<StartResult>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string },
  ): Promise<RunState>
  getRun(runId: string): Promise<RunState>
}

/** `ScheduleHost` for a Worker that reconciles schedules onto Durable Objects. */
export function durableObjectScheduleHost(namespace: {
  getByName(name: string): object
}): DurableObjectScheduleHost {
  const runs = loomsNamespace(namespace)

  return {
    startRun: (args) => {
      const runId = args.runId

      if (!runId) {
        return Promise.reject(new Error('ScheduleHost.startRun requires runId'))
      }

      return runs.getByName(runId).startRun(args)
    },
    signal: (runId, events, options) => runs.getByName(runId).signal(events, options),
    getRun: (runId) => runs.getByName(runId).getRun(),
  }
}

function loomsNamespace(namespace: {
  getByName(name: string): object
}): DurableObjectNamespaceLike<DurableObjectRunStub> {
  // SAFETY: callers pass a Looms Durable Object namespace, whose stub implements these methods.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return namespace as DurableObjectNamespaceLike<DurableObjectRunStub>
}
