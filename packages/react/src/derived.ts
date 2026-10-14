import {
  dropSupersededAttempts,
  project,
  retriedEffectId,
  type AnyEventEnvelope,
  type EventEnvelope,
  type InferSchemaOutput,
  type ProjectionDefinition,
  type RegisteredEvent,
  type SchemaInput,
} from '@looms/core'

export { EventIndex, eventThreadKey } from '@looms/core'

export interface LiveFoldDefinition<S, TEvent extends AnyEventEnvelope = RegisteredEvent> {
  readonly kind: 'liveFold'
  readonly name?: string
  readonly shape?: unknown
  readonly initialState: S
  reduce(state: S, event: TEvent): S
}

/**
 * Client-side fold that sees ephemeral events, which projections skip. Ephemeral events from an
 * effect attempt that the runtime later retried never reach the reducer. The reducer still owns
 * resets on domain events, such as the durable message that replaces streamed text. Use a
 * projection for anything else.
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
  return { ...def, kind: 'liveFold' }
}

function foldFrom<S, E extends AnyEventEnvelope>(
  definition: LiveFoldDefinition<S, E>,
  events: readonly E[],
  from: S,
): S {
  let state = from

  for (const event of dropSupersededAttempts(events)) {
    state = definition.reduce(state, event)
  }

  return state
}

/** Fold events through a live fold, as `useLiveFold` does, including ephemeral events. */
export function foldLive<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  definition: LiveFoldDefinition<S, TEvent>,
  events: readonly TEvent[],
): S {
  return foldFrom(definition, events, definition.initialState)
}

function hasNoRetries(batch: readonly AnyEventEnvelope[]): boolean {
  return !batch.some((event) => retriedEffectId(event) !== undefined)
}

type CacheEntry<S> = { state: S; upTo: number }

/** Folds only the events appended since the last call, unless `canAppend` rejects them. */
function advanceCache<D extends { readonly initialState: S }, S, E>(
  cache: WeakMap<D, CacheEntry<S>>,
  definition: D,
  events: readonly E[],
  compute: (definition: D, events: readonly E[], from: S) => S,
  canAppend: (batch: readonly E[]) => boolean = () => true,
): S {
  const cached = cache.get(definition)

  if (cached?.upTo === events.length) {
    return cached.state
  }

  const batch = cached && cached.upTo < events.length ? events.slice(cached.upTo) : undefined

  const state =
    cached && batch && canAppend(batch)
      ? compute(definition, batch, cached.state)
      : compute(definition, events, definition.initialState)

  cache.set(definition, { state, upTo: events.length })
  return state
}

export class ProjectionCache {
  private projectionCache = new WeakMap<ProjectionDefinition<any>, CacheEntry<any>>()
  private foldCache = new WeakMap<LiveFoldDefinition<any, any>, CacheEntry<any>>()

  project<S>(definition: ProjectionDefinition<S>, events: readonly EventEnvelope[]): S {
    return advanceCache(this.projectionCache, definition, events, project)
  }

  /** A retry can supersede events already folded, so a batch containing one refolds from scratch. */
  fold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
    definition: LiveFoldDefinition<S, TEvent>,
    events: readonly TEvent[],
  ): S {
    return advanceCache(this.foldCache, definition, events, foldFrom, hasNoRetries)
  }

  clear(): void {
    this.projectionCache = new WeakMap()
    this.foldCache = new WeakMap()
  }
}
