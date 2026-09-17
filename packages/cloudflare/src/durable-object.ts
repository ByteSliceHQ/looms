import { DurableObject } from 'cloudflare:workers'

import { createActorCell, type ActorCell } from '@looms/actor'
import type { AnyRuntimeModule } from '@looms/core'
import type { Projector } from '@looms/projectors'

import { alarmScheduler } from './alarm-scheduler'
import { durableObjectEventStore } from './event-store'

export interface LoomsDurableObjectConfig {
  readonly modules: readonly AnyRuntimeModule[]
  readonly projectors?: readonly Projector[]
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly trimAfterSnapshot?: { keepSnapshots: number }
}

/**
 * Base Durable Object class for hosting a Looms actor cell.
 * Subclasses implement `configure(env)` to supply configured modules.
 * Works identically on Cloudflare Workers and celld.
 */
export abstract class LoomsDurableObject<Env = unknown> extends DurableObject<Env> {
  private cellPromise?: Promise<ActorCell>

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

        const store = durableObjectEventStore(this.ctx, { projectors: config.projectors })
        const scheduler = alarmScheduler(this.ctx.storage)

        return createActorCell({
          runId,
          store,
          scheduler,
          modules: config.modules,
          snapshotEvery: config.snapshotEvery,
          maxWakeIterations: config.maxWakeIterations,
          trimAfterSnapshot: config.trimAfterSnapshot,
        })
      })
    }

    return this.cellPromise
  }

  override fetch(req: Request): Promise<Response> {
    return this.getCell().then((cell) => cell.fetch(req))
  }

  override alarm(): Promise<void> {
    return this.getCell()
      .then((cell) => cell.wake())
      .then(() => undefined)
  }
}
