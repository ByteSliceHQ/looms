import { Effect } from 'effect'

import {
  composeModules,
  EventStoreTag,
  makeMemoryEventStore,
  ModuleCompositionError,
  EventStoreError,
  snapshotStoreOf,
  withSnapshotStore,
  type AnyRuntimeModule,
  type AppendOptions,
  type AppendableEvent,
  type EventStore,
} from '@looms/core'
import { createRuntime, type LoomsRuntime } from '@looms/runtime'

import { assertReplayDeterministicEvents } from './replay-corpus'

export interface TestRuntime {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  run<A, E>(effect: Effect.Effect<A, E, EventStoreTag>): Promise<A>
}

export function createTestRuntime(modules: readonly AnyRuntimeModule[]): Promise<TestRuntime> {
  return Effect.runPromise(
    makeMemoryEventStore.pipe(
      Effect.map((store) => {
        const runtime = createRuntime({ modules, store })
        return {
          runtime,
          store,
          run: <A, E>(effect: Effect.Effect<A, E, EventStoreTag>) =>
            Effect.runPromise(Effect.provideService(effect, EventStoreTag, store)),
        }
      }),
    ),
  )
}

export function assertReplayDeterministic(test: TestRuntime, runId: string): Promise<void> {
  return test.run(test.runtime.getEvents(runId)).then((events) => {
    assertReplayDeterministicEvents(events, test.runtime.registry, runId)
  })
}

export {
  assertCorpusEntry,
  assertReplayDeterministicEvents,
  corpusRegistry,
  readCorpusEntry,
  type CorpusEntry,
} from './replay-corpus'
export { corpusChargeV1, corpusChargeV2, corpusDefinition, corpusModule } from './corpus-module'

export function moduleConformance(module: AnyRuntimeModule): string[] {
  const errors: string[] = []

  if (!module.namespace) {
    errors.push('namespace required')
  }

  if (!module.protocolVersion) {
    errors.push('protocolVersion required')
  }

  if (module.events && module.events.namespace !== module.namespace) {
    errors.push(`catalog namespace ${module.events.namespace} !== module ${module.namespace}`)
  }

  for (const effect of Object.values(module.effects ?? {})) {
    const { type, placement } = effect
    const hasExecute = 'execute' in effect

    if (!type.startsWith(`${module.namespace}.`)) {
      errors.push(`effect ${type} is not namespaced under ${module.namespace}`)
    }

    if (placement === 'local' && !hasExecute) {
      errors.push(`local effect ${type} is missing execute`)
    }

    if (placement === 'worker' && hasExecute) {
      errors.push(`worker effect ${type} must not define execute`)
    }
  }

  try {
    composeModules([module])
  } catch (err) {
    errors.push(err instanceof ModuleCompositionError ? err.message : String(err))
  }

  return errors
}

export type EventStoreFaultOperation = 'append' | 'read' | 'tail' | 'bounds' | 'trim' | 'listRuns'

export interface EventStoreFaultContext {
  readonly operation: EventStoreFaultOperation
  readonly runId: string | null
  readonly call: number
}

export interface FaultInjectingEventStore {
  readonly store: EventStore
  readonly calls: ReadonlyMap<EventStoreFaultOperation, number>
}

type MutableEventStore = {
  -readonly [K in keyof EventStore]: EventStore[K]
}

/**
 * Wraps an EventStore with deterministic delay/failure injection. Throw from
 * `before` to fail a call, or await inside it to pause a race at an exact store boundary.
 */
export function createFaultInjectingEventStore(
  source: EventStore,
  before: (context: EventStoreFaultContext) => void | Promise<void>,
): FaultInjectingEventStore {
  const calls = new Map<EventStoreFaultOperation, number>()

  const inject = (operation: EventStoreFaultOperation, runId: string | null) =>
    Effect.tryPromise({
      try: () => {
        const call = (calls.get(operation) ?? 0) + 1
        calls.set(operation, call)
        return Promise.resolve(before({ operation, runId, call }))
      },
      catch: (cause) =>
        cause instanceof EventStoreError
          ? cause
          : new EventStoreError(`Injected ${operation} fault`, cause),
    })

  const store: MutableEventStore = {
    append: (runId: string, events: ReadonlyArray<AppendableEvent>, options?: AppendOptions) =>
      inject('append', runId).pipe(Effect.andThen(source.append(runId, events, options))),
    read: (runId, options) =>
      inject('read', runId).pipe(Effect.andThen(source.read(runId, options))),
    tail: (runId) => inject('tail', runId).pipe(Effect.andThen(source.tail(runId))),
    subscribe: source.subscribe,
    listRuns: inject('listRuns', null).pipe(Effect.andThen(source.listRuns)),
  }

  if (source.bounds) {
    store.bounds = (runId) => inject('bounds', runId).pipe(Effect.andThen(source.bounds!(runId)))
  }

  if (source.trim) {
    store.trim = (runId, beforeSeq) =>
      inject('trim', runId).pipe(Effect.andThen(source.trim!(runId, beforeSeq)))
  }

  const snapshots = snapshotStoreOf(source)

  if (snapshots) {
    withSnapshotStore(store, snapshots)
  }

  return { store, calls }
}
