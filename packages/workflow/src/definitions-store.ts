import { Context, Layer } from 'effect'

import { definitionKey } from '@looms/core'

import type { WorkflowDefinition } from './definitions'

export interface WorkflowDefinitionStore {
  get(name: string, version: string): WorkflowDefinition | undefined
}

export class WorkflowDefinitionsTag extends Context.Service<
  WorkflowDefinitionsTag,
  WorkflowDefinitionStore
>()('looms/WorkflowDefinitions') {}

export function makeWorkflowDefinitionStore(
  definitions: ReadonlyArray<WorkflowDefinition>,
): WorkflowDefinitionStore {
  const map = new Map(
    definitions.map((def) => [definitionKey(def.kind, def.name, def.version), def]),
  )

  return { get: (name, version) => map.get(definitionKey('workflow', name, version)) }
}

export const WorkflowDefinitionsLive = (definitions: ReadonlyArray<WorkflowDefinition>) =>
  Layer.succeed(WorkflowDefinitionsTag, makeWorkflowDefinitionStore(definitions))
