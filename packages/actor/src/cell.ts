import { Effect } from 'effect'

import {
  EventStoreTag,
  type AnyRuntimeModule,
  type EventStore,
  type RunState,
  type SnapshotStore,
} from '@looms/core'
import {
  createFetchHandler,
  createRuntime,
  type LoomsRuntime,
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
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  readonly snapshotStore?: SnapshotStore
  readonly trimAfterSnapshot?: { keepSnapshots: number }
}

export interface ActorCell<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly runId: string
  readonly runtime: LoomsRuntime<TModules>
  readonly store: EventStore
  fetch(req: Request): Promise<Response>
  wake(): Promise<RunState>
  dispose(): void
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
    store,
    scheduler,
    snapshotEvery: options.snapshotEvery,
    maxWakeIterations: options.maxWakeIterations,
    snapshotStore: options.snapshotStore,
    trimAfterSnapshot: options.trimAfterSnapshot,
  })

  const fetchHandler = createFetchHandler({ runtime, store })

  return {
    runId,
    runtime,
    store,

    fetch: async (req: Request) => {
      const targetRunId = runIdFromRequest(req)

      if (targetRunId && targetRunId !== runId) {
        return new Response('Not Found', { status: 404 })
      }

      const res = await fetchHandler(req)

      if (res === null) {
        return new Response('Not Found', { status: 404 })
      }

      return res
    },

    wake: () => Effect.runPromise(Effect.provideService(runtime.wake(runId), EventStoreTag, store)),

    dispose: () => {
      runtime.dispose()
    },
  }
}
