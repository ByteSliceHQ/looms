import { DurableObject } from 'cloudflare:workers'
import { Effect } from 'effect'

import { createActorCell, type ActorCell } from '@looms/actor'
import type { AnyRuntimeModule, EventStoreTrimCoverage } from '@looms/core'
import type { Projector } from '@looms/projectors'

import { durableObjectAlarms } from './alarm-scheduler'
import { durableObjectEventStore, type DurableObjectEventStore } from './event-store'

export interface LoomsDurableObjectConfig {
  readonly modules: readonly AnyRuntimeModule[]
  readonly projectors?: readonly Projector[]
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly maxPendingRunOperations?: number
  readonly trimAfterSnapshot?: {
    readonly keepSnapshots: number
    readonly coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
}

/**
 * Base Durable Object class for hosting a Looms actor cell.
 * Subclasses implement `configure(env)` to supply configured modules.
 * Works identically on Cloudflare Workers and celld.
 */
export abstract class LoomsDurableObject<Env = unknown> extends DurableObject<Env> {
  private cellPromise?: Promise<ActorCell>
  private store?: DurableObjectEventStore

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
      })

      this.store = store

      const cell = createActorCell({
        runId,
        store,
        scheduler: alarms.scheduler,
        modules: config.modules,
        snapshotEvery: config.snapshotEvery,
        maxWakeIterations: config.maxWakeIterations,
        maxPendingRunOperations: config.maxPendingRunOperations,
        trimAfterSnapshot: config.trimAfterSnapshot,
      })

      const delivery = store.projectorDelivery

      const recoverProjectors = delivery
        ? Effect.runPromise(delivery.recover(runId).pipe(Effect.andThen(delivery.deliver(runId))))
        : Promise.resolve()

      return recoverProjectors.then(() => cell.recoverWake()).then(() => cell)
    })
  }

  override fetch(req: Request): Promise<Response> {
    return this.getCell().then((cell) => cell.fetch(req))
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
