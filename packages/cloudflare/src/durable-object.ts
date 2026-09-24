import { DurableObject } from 'cloudflare:workers'

import { createActorCell, type ActorCell } from '@looms/actor'
import type { AnyRuntimeModule, EventStoreTrimCoverage } from '@looms/core'
import type { Projector } from '@looms/projectors'

import { alarmScheduler, scheduleAlarmAtEarliest } from './alarm-scheduler'
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
    if (!this.cellPromise) {
      this.cellPromise = Promise.resolve(this.configure(this.env)).then((config) => {
        const runId = this.ctx.id.name

        if (!runId) {
          throw new Error(
            'LoomsDurableObject requires a named Durable Object id (use idFromName / getByName)',
          )
        }

        const scheduler = alarmScheduler(
          this.ctx.storage,
          () => this.store?.projectorDelivery?.nextRetryAt(runId) ?? Promise.resolve(null),
        )

        const store = durableObjectEventStore(this.ctx, {
          projectors: config.projectors,
          scheduleProjectorRetry: (at) => scheduleAlarmAtEarliest(this.ctx.storage, at),
        })

        this.store = store

        const cell = createActorCell({
          runId,
          store,
          scheduler,
          modules: config.modules,
          snapshotEvery: config.snapshotEvery,
          maxWakeIterations: config.maxWakeIterations,
          maxPendingRunOperations: config.maxPendingRunOperations,
          trimAfterSnapshot: config.trimAfterSnapshot,
        })

        const delivery = store.projectorDelivery
        const recoverProjectors = delivery?.recover(runId) ?? Promise.resolve(0)

        return recoverProjectors
          .then(() => delivery?.deliver(runId))
          .then(() => cell.recoverWake())
          .then(() => cell)
      })
    }

    return this.cellPromise
  }

  override fetch(req: Request): Promise<Response> {
    return this.getCell().then((cell) => cell.fetch(req))
  }

  override alarm(): Promise<void> {
    return this.getCell()
      .then((cell) => {
        const delivery =
          this.store?.projectorDelivery?.deliver(this.ctx.id.name ?? '') ?? Promise.resolve()

        return delivery.then(() => cell.wake())
      })
      .catch((error) => {
        const retryAt = performance.timeOrigin + performance.now() + 2_000
        return this.ctx.storage.setAlarm(retryAt).then(() => {
          throw error
        })
      })
      .then(() => undefined)
  }
}
