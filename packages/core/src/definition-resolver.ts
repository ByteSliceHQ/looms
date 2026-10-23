import { Data, Effect, Predicate } from 'effect'

import type { VersionedDefinition } from './definition-store'
import type { EventEnvelope } from './envelope'
import type { JsonValue } from './types'
import { DEFAULT_DEFINITION_VERSION, definitionKey } from './module'

export class DefinitionResolveError extends Data.TaggedError('DefinitionResolveError')<{
  readonly kind: string
  readonly name: string
  readonly version: string
  readonly message: string
}> {
  constructor(kind: string, name: string, version: string, message: string) {
    super({ kind, name, version, message })
    this.name = 'DefinitionResolveError'
  }
}

/**
 * Loads one definition by the identity pinned on a run.
 * `peek` is synchronous and only returns a definition this resolver already holds.
 * `resolve` may fetch, and it caches through {@link cachedDefinitionResolver}.
 */
export interface DefinitionResolver {
  readonly peek: (kind: string, name: string, version: string) => VersionedDefinition | undefined
  readonly resolve: (
    kind: string,
    name: string,
    version: string,
  ) => Effect.Effect<VersionedDefinition | undefined, DefinitionResolveError>
}

export const DEFAULT_DEFINITION_CACHE_CAPACITY = 256

/** Definitions registered on a module. A miss is `undefined`, not an error. */
export function staticDefinitionResolver(
  definitions: ReadonlyArray<VersionedDefinition>,
): DefinitionResolver {
  const byKey = new Map(
    definitions.map(
      (definition) =>
        [definitionKey(definition.kind, definition.name, definition.version), definition] as const,
    ),
  )

  const lookup = (kind: string, name: string, version: string) =>
    byKey.get(definitionKey(kind, name, version))

  return {
    peek: lookup,
    resolve: (kind, name, version) => Effect.succeed(lookup(kind, name, version)),
  }
}

/** First resolver that returns a definition wins. Later resolvers are not called. */
export function chainDefinitionResolvers(
  resolvers: ReadonlyArray<DefinitionResolver>,
): DefinitionResolver {
  return {
    peek(kind, name, version) {
      for (const resolver of resolvers) {
        const found = resolver.peek(kind, name, version)

        if (found) {
          return found
        }
      }

      return undefined
    },
    resolve(kind, name, version) {
      return Effect.gen(function* () {
        for (const resolver of resolvers) {
          const found = yield* resolver.resolve(kind, name, version)

          if (found) {
            return found
          }
        }

        return undefined
      })
    },
  }
}

/**
 * Remembers successful lookups and misses. A miss stays cached so recovery does not
 * fetch a deleted definition on every wake. Failures are not cached.
 */
export function cachedDefinitionResolver(
  inner: DefinitionResolver,
  options?: { readonly capacity?: number },
): DefinitionResolver {
  const capacity = options?.capacity ?? DEFAULT_DEFINITION_CACHE_CAPACITY
  const entries = new Map<string, VersionedDefinition | undefined>()

  const remember = (key: string, value: VersionedDefinition | undefined): void => {
    entries.delete(key)
    entries.set(key, value)

    while (entries.size > capacity) {
      const oldest = entries.keys().next().value

      if (oldest === undefined) {
        return
      }

      entries.delete(oldest)
    }
  }

  return {
    peek(kind, name, version) {
      const key = definitionKey(kind, name, version)

      if (!entries.has(key)) {
        return inner.peek(kind, name, version)
      }

      const value = entries.get(key)
      remember(key, value)
      return value
    },
    resolve(kind, name, version) {
      const key = definitionKey(kind, name, version)

      if (entries.has(key)) {
        const value = entries.get(key)
        remember(key, value)
        return Effect.succeed(value)
      }

      return inner.resolve(kind, name, version).pipe(
        Effect.tap((value) =>
          Effect.sync(() => {
            remember(key, value)
          }),
        ),
      )
    },
  }
}

/** Identities pinned by `runtime.run.started` and `runtime.thread.started`. */
export function pinnedDefinitionRefs(
  events: readonly EventEnvelope[],
): readonly VersionedDefinition[] {
  const refs: VersionedDefinition[] = []
  const seen = new Set<string>()

  for (const event of events) {
    if (event.type !== 'runtime.run.started' && event.type !== 'runtime.thread.started') {
      continue
    }

    const pinned = readPinned(event.payload)

    if (!pinned) {
      continue
    }

    const key = definitionKey(pinned.kind, pinned.name, pinned.version)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    refs.push(pinned)
  }

  return refs
}

/** Resolves every pinned identity so a later synchronous lookup can see it. */
export function primePinnedDefinitions(
  resolver: DefinitionResolver,
  events: readonly EventEnvelope[],
): Effect.Effect<void, DefinitionResolveError> {
  return Effect.gen(function* () {
    for (const ref of pinnedDefinitionRefs(events)) {
      yield* resolver.resolve(ref.kind, ref.name, ref.version)
    }
  })
}

function readPinned(payload: JsonValue): VersionedDefinition | undefined {
  if (!Predicate.isObject(payload) || !('kind' in payload) || !('definitionName' in payload)) {
    return undefined
  }

  const kind = payload.kind
  const name = payload.definitionName
  const version = 'definitionVersion' in payload ? payload.definitionVersion : undefined

  if (!Predicate.isString(kind) || !Predicate.isString(name)) {
    return undefined
  }

  return {
    kind,
    name,
    version: Predicate.isString(version) ? version : DEFAULT_DEFINITION_VERSION,
  }
}
