import { Effect, Predicate } from 'effect'

import {
  composeModules,
  EventStoreTag,
  foldRun,
  makeMemoryEventStore,
  ModuleCompositionError,
  stringifyJson,
  type AnyRuntimeModule,
  type EventStore,
} from '@looms/core'
import { createRuntime, type LoomsRuntime } from '@looms/runtime'

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
    const first = foldRun(events, test.runtime.registry, { runId })
    const second = foldRun(events, test.runtime.registry, { runId })

    if (stringifyJson(first) !== stringifyJson(second)) {
      throw new Error(`Replay is not deterministic for run ${runId}`)
    }
  })
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
