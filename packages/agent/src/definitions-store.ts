import { Context, Layer } from 'effect'

import { makeDefinitionStore, type DefinitionStore } from '@looms/core'

import type { AgentDefinition } from './definitions'

export type AgentDefinitionStore = DefinitionStore<AgentDefinition>

export class AgentDefinitionsTag extends Context.Service<
  AgentDefinitionsTag,
  AgentDefinitionStore
>()('looms/AgentDefinitions') {}

export function makeAgentDefinitionStore(
  definitions: ReadonlyArray<AgentDefinition>,
): AgentDefinitionStore {
  return makeDefinitionStore('agent', definitions)
}

export const AgentDefinitionsLive = (definitions: ReadonlyArray<AgentDefinition>) =>
  Layer.succeed(AgentDefinitionsTag, makeAgentDefinitionStore(definitions))
