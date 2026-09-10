import { Effect, Predicate } from 'effect'

import {
  composeModules,
  EventStoreTag,
  foldRun,
  makeMemoryEventStore,
  ModuleCompositionError,
  type AnyRuntimeModule,
  type EventStore,
} from '@looms/core'
import { createRuntime, type LoomsRuntime, type RegisteredDefinition } from '@looms/runtime'

type NamedEffect = {
  readonly type: string
  readonly hasExecute: boolean
}

type EffectBag = {
  readonly [name: string]: {
    readonly type: string
  }
}

function namedEffects(effects: EffectBag): NamedEffect[] {
  const listed: NamedEffect[] = []

  for (const key of Object.keys(effects)) {
    const value = effects[key]

    if (!value || !Predicate.isString(value.type)) {
      continue
    }

    listed.push({
      type: value.type,
      hasExecute: 'execute' in value,
    })
  }

  return listed
}

export interface TestRuntime {
  readonly runtime: LoomsRuntime
  readonly store: EventStore
  run<A, E>(effect: Effect.Effect<A, E, EventStoreTag>): Promise<A>
}

export async function createTestRuntime(
  modules: readonly AnyRuntimeModule[],
  definitions: RegisteredDefinition[] = [],
): Promise<TestRuntime> {
  const store = await Effect.runPromise(makeMemoryEventStore)
  const runtime = createRuntime({ modules, store, definitions })
  return {
    runtime,
    store,
    run: (effect) => Effect.runPromise(Effect.provideService(effect, EventStoreTag, store)),
  }
}

export async function assertReplayDeterministic(test: TestRuntime, runId: string): Promise<void> {
  const events = await test.run(test.runtime.getEvents(runId))
  const first = foldRun(events, test.runtime.registry, { runId })
  const second = foldRun(events, test.runtime.registry, { runId })

  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error(`Replay is not deterministic for run ${runId}`)
  }
}

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

  if (module.effects) {
    for (const effect of namedEffects(module.effects)) {
      if (!effect.type.startsWith(`${module.namespace}.`)) {
        errors.push(`effect ${effect.type} is not namespaced under ${module.namespace}`)
      }

      if (!effect.hasExecute) {
        errors.push(`effect ${effect.type} is missing execute`)
      }
    }
  }

  try {
    composeModules([module])
  } catch (err) {
    errors.push(err instanceof ModuleCompositionError ? err.message : String(err))
  }

  return errors
}
