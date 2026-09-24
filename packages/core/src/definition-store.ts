import { definitionKey } from './module'

export interface VersionedDefinition {
  readonly kind: string
  readonly name: string
  readonly version: string
}

/** Lookup of one definition kind by name and version. */
export interface DefinitionStore<TDefinition> {
  get(name: string, version: string): TDefinition | undefined
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

  return { get: (name, version) => byKey.get(definitionKey(kind, name, version)) }
}
