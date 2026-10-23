import { Effect } from 'effect'

import type { DefinitionResolveError, DefinitionResolver } from './definition-resolver'
import { definitionKey } from './module'

export interface VersionedDefinition {
  readonly kind: string
  readonly name: string
  readonly version: string
}

/** Lookup of one definition kind by name and version. */
export interface DefinitionStore<TDefinition> {
  get(name: string, version: string): TDefinition | undefined
  /** Static definition, or a definition the bound resolver has already loaded. */
  resolve(
    name: string,
    version: string,
  ): Effect.Effect<TDefinition | undefined, DefinitionResolveError>
  /** Called by the runtime before the module's services are built. */
  useResolver(resolver: DefinitionResolver): void
}

/** Indexes definitions of one kind by `definitionKey`. */
export function makeDefinitionStore<TDefinition extends VersionedDefinition>(
  kind: TDefinition['kind'],
  definitions: ReadonlyArray<TDefinition>,
): DefinitionStore<TDefinition> {
  const byKey = new Map(
    definitions.map(
      (definition) =>
        [definitionKey(definition.kind, definition.name, definition.version), definition] as const,
    ),
  )

  let resolver: DefinitionResolver | undefined

  const get = (name: string, version: string): TDefinition | undefined => {
    const stored = byKey.get(definitionKey(kind, name, version))

    if (stored) {
      return stored
    }

    const peeked = resolver?.peek(kind, name, version)

    if (peeked && isStoredDefinition<TDefinition>(kind, peeked)) {
      return peeked
    }

    return undefined
  }

  return {
    get,
    useResolver(next) {
      resolver = next
    },
    resolve(name, version) {
      const stored = get(name, version)

      if (stored) {
        return Effect.succeed(stored)
      }

      if (!resolver) {
        // Effect.void is Effect<void>, which is not a missing definition.
        // oxlint-disable-next-line effecttsgo/effect-succeed-with-void
        return Effect.succeed(undefined)
      }

      return resolver.resolve(kind, name, version).pipe(
        Effect.map((found) =>
          found && isStoredDefinition<TDefinition>(kind, found) ? found : undefined,
        ),
      )
    },
  }
}

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- the predicate returns the store's definition type
function isStoredDefinition<TDefinition extends VersionedDefinition>(
  kind: string,
  value: VersionedDefinition,
): value is TDefinition {
  return value.kind === kind
}
