import { Context, Layer } from 'effect'

import type { WorkflowDefinition } from './definitions'

export interface WorkflowDefinitionStore {
  get(name: string): WorkflowDefinition | undefined
}

export class WorkflowDefinitionsTag extends Context.Service<
  WorkflowDefinitionsTag,
  WorkflowDefinitionStore
>()('looms/WorkflowDefinitions') {}

export function makeWorkflowDefinitionStore(
  definitions: ReadonlyArray<WorkflowDefinition>,
): WorkflowDefinitionStore {
  const map = new Map(definitions.map((def) => [def.name, def]))
  return { get: (name) => map.get(name) }
}

export const WorkflowDefinitionsLive = (definitions: ReadonlyArray<WorkflowDefinition>) =>
  Layer.succeed(WorkflowDefinitionsTag, makeWorkflowDefinitionStore(definitions))
