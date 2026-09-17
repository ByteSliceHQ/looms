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
  dispose(): Promise<void>
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

    fetch: (req: Request) => {
      const targetRunId = runIdFromRequest(req)

      if (targetRunId && targetRunId !== runId) {
        return Promise.resolve(new Response('Not Found', { status: 404 }))
      }

      return fetchHandler(req).then((res) => res ?? new Response('Not Found', { status: 404 }))
    },

    wake: () => Effect.runPromise(Effect.provideService(runtime.wake(runId), EventStoreTag, store)),

    dispose: () => Effect.runPromise(runtime.dispose),
  }
}
