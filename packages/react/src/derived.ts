import {
  isJsonObject,
  isJsonString,
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
  return def
}

function retriedEffectId(event: AnyEventEnvelope): string | undefined {
  if (event.type !== 'runtime.effect.retry.scheduled' || !isJsonObject(event.payload)) {
    return undefined
  }

  const effectId = event.payload.effectId
  return isJsonString(effectId) ? effectId : undefined
}

/** Drops ephemeral events whose effect attempt a later retry in `events` superseded. */
function currentAttempts<E extends AnyEventEnvelope>(events: readonly E[]): readonly E[] {
  const lastRetry = new Map<string, number>()

  events.forEach((event, index) => {
    const effectId = retriedEffectId(event)

    if (effectId !== undefined) {
      lastRetry.set(effectId, index)
    }
  })

  if (lastRetry.size === 0) {
    return events
  }

  return events.filter(
    (event, index) =>
      !event.ephemeral || !event.effectId || (lastRetry.get(event.effectId) ?? -1) < index,
  )
}

function reduceAll<S, E extends AnyEventEnvelope>(
  definition: LiveFoldDefinition<S, E>,
  events: readonly E[],
  from: S,
): S {
  let state = from

  for (const event of events) {
    state = definition.reduce(state, event)
  }

  return state
}

/** Fold events through a live fold, as `useLiveFold` does, including ephemeral events. */
export function foldLive<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
  definition: LiveFoldDefinition<S, TEvent>,
  events: readonly TEvent[],
): S {
  return reduceAll(definition, currentAttempts(events), definition.initialState)
}

type CacheEntry<S> = { state: S; upTo: number }

type FoldCacheEntry<S> = CacheEntry<S> & {
  /** Effects whose ephemeral events are already folded into `state`. */
  readonly streamedEffects: Set<string>
}

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
  private foldCache = new WeakMap<LiveFoldDefinition<any, any>, FoldCacheEntry<any>>()

  project<S>(definition: ProjectionDefinition<S>, events: readonly EventEnvelope[]): S {
    return advanceCache(this.projectionCache, definition, events, project)
  }

  /** Same result as `foldLive`, folding only new events unless a retry supersedes folded ones. */
  fold<S, TEvent extends AnyEventEnvelope = RegisteredEvent>(
    definition: LiveFoldDefinition<S, TEvent>,
    events: readonly TEvent[],
  ): S {
    const cached: FoldCacheEntry<S> | undefined = this.foldCache.get(definition)

    if (cached?.upTo === events.length) {
      return cached.state
    }

    if (cached && cached.upTo < events.length) {
      const batch = events.slice(cached.upTo)

      const supersedesFolded = batch.some((event) => {
        const effectId = retriedEffectId(event)
        return effectId !== undefined && cached.streamedEffects.has(effectId)
      })

      if (!supersedesFolded) {
        return this.advanceFold(
          definition,
          batch,
          cached.state,
          cached.streamedEffects,
          events.length,
        )
      }
    }

    return this.advanceFold(definition, events, definition.initialState, new Set(), events.length)
  }

  private advanceFold<S, E extends AnyEventEnvelope>(
    definition: LiveFoldDefinition<S, E>,
    batch: readonly E[],
    from: S,
    streamedEffects: Set<string>,
    upTo: number,
  ): S {
    const kept = currentAttempts(batch)

    for (const event of kept) {
      if (event.ephemeral && event.effectId) {
        streamedEffects.add(event.effectId)
      }
    }

    const state = reduceAll(definition, kept, from)
    this.foldCache.set(definition, { state, upTo, streamedEffects })
    return state
  }

  clear(): void {
    this.projectionCache = new WeakMap()
    this.foldCache = new WeakMap()
  }
}
