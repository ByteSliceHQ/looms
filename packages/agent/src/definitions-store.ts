import { Context, Layer } from 'effect'
import type { AgentDefinition } from './definitions'

export interface AgentDefinitionStore {
  get(name: string): AgentDefinition | undefined
}

export class AgentDefinitionsTag extends Context.Service<AgentDefinitionsTag, AgentDefinitionStore>()(
  'looms/AgentDefinitions',
) {}

export function makeAgentDefinitionStore(
  definitions: ReadonlyArray<AgentDefinition>,
): AgentDefinitionStore {
  const map = new Map(definitions.map((def) => [def.name, def]))
  return {
    get: (name) => map.get(name),
  }
}

export const AgentDefinitionsLive = (definitions: ReadonlyArray<AgentDefinition>) =>
  Layer.succeed(AgentDefinitionsTag, makeAgentDefinitionStore(definitions))
