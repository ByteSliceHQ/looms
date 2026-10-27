/** Default pinned definition version when a start event omits one. */
export const DEFAULT_DEFINITION_VERSION = 'v1'

export function definitionKey(kind: string, name: string, version: string): string {
  return `${kind}:${name}@${version}`
}
