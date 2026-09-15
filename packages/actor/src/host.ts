import { Effect } from 'effect'

import type {
  AnyRuntimeModule,
  DefinitionRef,
  EventStore,
  RunState,
  SnapshotStore,
} from '@looms/core'
import { EventStoreTag } from '@looms/core'
import { createTimeoutScheduler, isLoomsApiPath } from '@looms/runtime'

import { createActorCell, type ActorCell } from './cell'
import { resolveRunTarget } from './routing'

export interface LocalActorHostOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly createStore: (runId: string) => EventStore | Promise<EventStore>
  readonly modules: TModules
  readonly definitions?: ReadonlyArray<DefinitionRef>
  readonly snapshotStore?: SnapshotStore
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly trimAfterSnapshot?: { keepSnapshots: number }
  /**
   * After creating a cell, rescan its store for pending timers (process restart).
   * Default true. No-op for empty in-memory stores.
   */
  readonly rescanTimers?: boolean
}

export interface LocalActorHost<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  getCell(runId: string): Promise<ActorCell<TModules>>
  fetch(req: Request): Promise<Response | null>
  dispose(): void
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

  const getCell = (runId: string): Promise<ActorCell<TModules>> => {
    const existing = cells.get(runId)

    if (existing) {
      return existing
    }

    const cellPromise = (async () => {
      const store = await options.createStore(runId)

      // Assign after createActorCell so the scheduler never closes over an unassigned cell.
      let wake: (() => Promise<RunState>) | undefined

      const scheduler = createTimeoutScheduler((scheduledRunId) => {
        if (scheduledRunId !== runId) {
          return
        }

        void wake?.().catch((err) => {
          console.error('[actor host wake error]', err)
        })
      })

      const cell = createActorCell({
        runId,
        store,
        scheduler,
        modules: options.modules,
        definitions: options.definitions,
        snapshotStore: options.snapshotStore,
        snapshotEvery: options.snapshotEvery,
        maxWakeIterations: options.maxWakeIterations,
        trimAfterSnapshot: options.trimAfterSnapshot,
      })

      wake = () => cell.wake()

      if (rescanTimers) {
        await Effect.runPromise(
          Effect.provideService(cell.runtime.rescanTimers(), EventStoreTag, store),
        ).catch((err) => {
          console.error('[actor host rescan timers error]', err)
        })
      }

      return cell
    })()

    cells.set(runId, cellPromise)
    return cellPromise
  }

  return {
    getCell,

    fetch: async (req: Request): Promise<Response | null> => {
      const url = new URL(req.url)

      if (!isLoomsApiPath(url.pathname)) {
        return null
      }

      if (url.pathname === '/health') {
        return Response.json({ ok: true })
      }

      if (req.method === 'GET' && url.pathname === '/runs') {
        return Response.json(
          {
            error: 'Global run listing is not supported in the actor host without a global index',
          },
          { status: 501 },
        )
      }

      try {
        const { runId, request } = await resolveRunTarget(req)
        const cell = await getCell(runId)
        return cell.fetch(request)
      } catch {
        return new Response('Not Found', { status: 404 })
      }
    },

    dispose: () => {
      for (const promise of cells.values()) {
        void promise.then((cell) => cell.dispose())
      }

      cells.clear()
    },
  }
}
