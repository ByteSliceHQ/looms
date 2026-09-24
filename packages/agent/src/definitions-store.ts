import { Context, Layer } from 'effect'

import { definitionKey } from '@looms/core'

import type { AgentDefinition } from './definitions'

export interface AgentDefinitionStore {
  get(name: string, version: string): AgentDefinition | undefined
}

export class AgentDefinitionsTag extends Context.Service<
  AgentDefinitionsTag,
  AgentDefinitionStore
>()('looms/AgentDefinitions') {}

export function makeAgentDefinitionStore(
  definitions: ReadonlyArray<AgentDefinition>,
): AgentDefinitionStore {
  const map = new Map(
    definitions.map((def) => [definitionKey(def.kind, def.name, def.version), def]),
  )

  return {
    get: (name, version) => map.get(definitionKey('agent', name, version)),
  }
}

export const AgentDefinitionsLive = (definitions: ReadonlyArray<AgentDefinition>) =>
  Layer.succeed(AgentDefinitionsTag, makeAgentDefinitionStore(definitions))
