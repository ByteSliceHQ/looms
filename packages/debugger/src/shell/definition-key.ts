import type { PublishedDefinition } from '@looms/core'

/** Definitions are unique by kind and name; the same name can appear under two kinds. */
export function definitionKey(definition: Pick<PublishedDefinition, 'kind' | 'name'>): string {
  return `${definition.kind}:${definition.name}`
}
