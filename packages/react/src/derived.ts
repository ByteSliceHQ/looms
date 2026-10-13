import {
  project,
  type EventEnvelope,
  type InferSchemaOutput,
  type ProjectionDefinition,
  type SchemaInput,
} from '@looms/core'
import type { AnyEventEnvelope, RegisteredEvent } from '@looms/core'

export { EventIndex, eventThreadKey } from '@looms/core'

export interface LiveFoldDefinition<S, TEvent extends AnyEventEnvelope = RegisteredEvent> {
  readonly name?: string
  readonly shape?: unknown
  readonly initialState: S
  reduce(state: S, event: TEvent): S
}

/**
 * Client-side fold that sees ephemeral events, which projections skip. Ephemeral events are
 * provisional: a retried effect leaves its earlier attempt's events in the log, so the reducer
 * must reset on the durable events that supersede them. Use a projection for anything else.
 */
export function defineLiveFold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(def: {
  readonly name?: string
  readonly shape?: undefined
  readonly initialState: S
  reduce(state: S, event: TEvent): S
}): LiveFoldDefinition<S, TEvent>
export function defineLiveFold<
  TShape extends SchemaInput,
  TEvent extends AnyEventEnvelope = RegisteredEvent,
>(def: {
  readonly name?: string
  readonly shape: TShape
  readonly initialState: InferSchemaOutput<TShape>
  reduce(state: NoInfer<InferSchemaOutput<TShape>>, event: TEvent): InferSchemaOutput<TShape>
}): LiveFoldDefinition<InferSchemaOutput<TShape>, TEvent>

export function defineLiveFold(def: {
  readonly name?: string
  readonly shape?: unknown
  readonly initialState: any
  reduce(state: any, event: AnyEventEnvelope): any
}): LiveFoldDefinition<any, any> {
  return def
}

/** Fold a live fold over events, including ephemeral ones. */
export function foldEvents<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  definition: LiveFoldDefinition<S, TEvent>,
  events: readonly TEvent[],
  from?: S,
): S {
  let state = from !== undefined ? from : definition.initialState

  for (const event of events) {
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
  private foldCache = new WeakMap<LiveFoldDefinition<any, any>, CacheEntry<any>>()

  project<S>(definition: ProjectionDefinition<S>, events: readonly EventEnvelope[]): S {
    return advanceCache(this.projectionCache, definition, events, project)
  }

  fold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
    definition: LiveFoldDefinition<S, TEvent>,
    events: readonly TEvent[],
  ): S {
    return advanceCache(this.foldCache, definition, events, foldEvents)
  }

  clear(): void {
    this.projectionCache = new WeakMap()
    this.foldCache = new WeakMap()
  }
}
