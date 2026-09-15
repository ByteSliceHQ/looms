import { project, type EventEnvelope, type ProjectionDefinition } from '@looms/core'

import type { AnyEventEnvelope, RegisteredEvent } from './register'

export type { AnyEventEnvelope } from './register'
export { EventIndex, eventThreadKey } from '@looms/core'

export interface EventFoldDefinition<S, TEvent extends AnyEventEnvelope = RegisteredEvent> {
  readonly name?: string
  readonly initialState: S
  reduce(state: S, event: TEvent): S
  readonly includeEphemeral?: boolean
}

export function createFold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  def: EventFoldDefinition<S, TEvent>,
): EventFoldDefinition<S, TEvent> {
  return def
}

export function foldEvents<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  definition: EventFoldDefinition<S, TEvent>,
  events: readonly TEvent[],
  from?: S,
): S {
  let state = from !== undefined ? from : definition.initialState
  const includeEphemeral = definition.includeEphemeral ?? false

  for (const event of events) {
    if (event.ephemeral && !includeEphemeral) {
      continue
    }

    state = definition.reduce(state, event)
  }

  return state
}

type CacheEntry<S> = { state: S; upTo: number }

function advanceCache<D extends object, S, E>(
  cache: WeakMap<D, CacheEntry<S>>,
  definition: D,
  events: readonly E[],
  compute: (definition: D, events: readonly E[], from?: S) => S,
): S {
  const total = events.length
  const cached = cache.get(definition)

  if (!cached) {
    const state = compute(definition, events)
    cache.set(definition, { state, upTo: total })
    return state
  }

  if (cached.upTo === total) {
    return cached.state
  }

  if (cached.upTo < total) {
    const state = compute(definition, events.slice(cached.upTo), cached.state)
    cache.set(definition, { state, upTo: total })
    return state
  }

  const state = compute(definition, events)
  cache.set(definition, { state, upTo: total })
  return state
}

export class ProjectionCache {
  private projectionCache = new WeakMap<ProjectionDefinition<any>, CacheEntry<any>>()
  private foldCache = new WeakMap<EventFoldDefinition<any, any>, CacheEntry<any>>()

  project<S>(definition: ProjectionDefinition<S>, events: readonly EventEnvelope[]): S {
    return advanceCache(this.projectionCache, definition, events, project)
  }

  fold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
    definition: EventFoldDefinition<S, TEvent>,
    events: readonly TEvent[],
  ): S {
    return advanceCache(this.foldCache, definition, events, foldEvents)
  }

  clear(): void {
    this.projectionCache = new WeakMap()
    this.foldCache = new WeakMap()
  }
}
