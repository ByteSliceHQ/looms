import { DurableObject } from 'cloudflare:workers'

import { createActorCell, type ActorCell } from '@looms/actor'
import type { AnyRuntimeModule, DefinitionRef } from '@looms/core'
import type { Projector } from '@looms/projectors'

import { alarmScheduler } from './alarm-scheduler'
import { durableObjectEventStore } from './event-store'

export interface LoomsDurableObjectConfig {
  readonly modules: readonly AnyRuntimeModule[]
  readonly definitions?: ReadonlyArray<DefinitionRef>
  readonly projectors?: readonly Projector[]
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly trimAfterSnapshot?: { keepSnapshots: number }
}

/**
 * Base Durable Object class for hosting a Looms actor cell.
 * Subclasses implement `configure(env)` to supply modules and definitions.
 * Works identically on Cloudflare Workers and celld.
 */
export abstract class LoomsDurableObject<Env = unknown> extends DurableObject<Env> {
  private cellPromise?: Promise<ActorCell>

  abstract configure(env: Env): LoomsDurableObjectConfig | Promise<LoomsDurableObjectConfig>

  private async getCell(): Promise<ActorCell> {
    if (!this.cellPromise) {
      this.cellPromise = (async () => {
        const runId = this.ctx.id.name

        if (!runId) {
          throw new Error(
            'LoomsDurableObject requires a named Durable Object id (use idFromName / getByName)',
          )
        }

        const config = await this.configure(this.env)
        const store = durableObjectEventStore(this.ctx, { projectors: config.projectors })
        const scheduler = alarmScheduler(this.ctx.storage)

        return createActorCell({
          runId,
          store,
          scheduler,
          modules: config.modules,
          definitions: config.definitions,
          snapshotEvery: config.snapshotEvery,
          maxWakeIterations: config.maxWakeIterations,
          trimAfterSnapshot: config.trimAfterSnapshot,
        })
      })()
    }

    return this.cellPromise
  }

  override async fetch(req: Request): Promise<Response> {
    const cell = await this.getCell()
    return cell.fetch(req)
  }

  override async alarm(): Promise<void> {
    const cell = await this.getCell()
    await cell.wake()
  }
}
