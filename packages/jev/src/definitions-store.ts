import { Context, Layer } from 'effect'

import type { JevDefinition } from './definitions'

export interface JevDefinitionStore {
  get(name: string): JevDefinition | undefined
}

export class JevDefinitionsTag extends Context.Service<JevDefinitionsTag, JevDefinitionStore>()(
  'looms/JevDefinitions',
) {}

export function makeJevDefinitionStore(
  definitions: ReadonlyArray<JevDefinition>,
): JevDefinitionStore {
  const map = new Map(definitions.map((def) => [def.name, def]))
  return { get: (name) => map.get(name) }
}

export const JevDefinitionsLive = (definitions: ReadonlyArray<JevDefinition>) =>
  Layer.succeed(JevDefinitionsTag, makeJevDefinitionStore(definitions))
