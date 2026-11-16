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

type OverlayEntry<S> = { base: S; pending: number; state: S }

/**
 * Folds events not yet confirmed on top of the confirmed state. The confirmed fold stays
 * incremental; the overlay is refolded only when the confirmed state or the pending set changes.
 */
function overlay<D extends object, S, E>(
  cache: WeakMap<D, OverlayEntry<S>>,
  definition: D,
  base: S,
  pending: readonly E[],
  pendingVersion: number,
  compute: (definition: D, events: readonly E[], from: S) => S,
): S {
  if (pending.length === 0) {
    return base
  }

  const cached = cache.get(definition)

  if (cached && cached.base === base && cached.pending === pendingVersion) {
    return cached.state
  }

  const state = compute(definition, pending, base)
  cache.set(definition, { base, pending: pendingVersion, state })
  return state
}

export class ProjectionCache {
  private projectionCache = new WeakMap<ProjectionDefinition<any>, CacheEntry<any>>()
  private foldCache = new WeakMap<LiveFoldDefinition<any, any>, CacheEntry<any>>()
  private projectionOverlay = new WeakMap<ProjectionDefinition<any>, OverlayEntry<any>>()
  private foldOverlay = new WeakMap<LiveFoldDefinition<any, any>, OverlayEntry<any>>()

  /** `pending` are events shown before the host confirms them; they fold after `events`. */
  project<S>(
    definition: ProjectionDefinition<S>,
    events: readonly EventEnvelope[],
    pending: readonly EventEnvelope[] = [],
    pendingVersion = 0,
  ): S {
    const base = advanceCache(this.projectionCache, definition, events, project)
    return overlay(this.projectionOverlay, definition, base, pending, pendingVersion, project)
  }

  /** A retry can supersede events already folded, so a batch containing one refolds from scratch. */
  fold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
    definition: LiveFoldDefinition<S, TEvent>,
    events: readonly TEvent[],
    pending: readonly TEvent[] = [],
    pendingVersion = 0,
  ): S {
    const base = advanceCache(this.foldCache, definition, events, foldFrom, hasNoRetries)
    return overlay(this.foldOverlay, definition, base, pending, pendingVersion, foldFrom)
  }

  clear(): void {
    this.projectionCache = new WeakMap()
    this.foldCache = new WeakMap()
    this.projectionOverlay = new WeakMap()
    this.foldOverlay = new WeakMap()
  }
}
