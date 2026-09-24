import { Context, Layer } from 'effect'

import { makeDefinitionStore, type DefinitionStore } from '@looms/core'

import type { WorkflowDefinition } from './definitions'

export type WorkflowDefinitionStore = DefinitionStore<WorkflowDefinition>

export class WorkflowDefinitionsTag extends Context.Service<
  WorkflowDefinitionsTag,
  WorkflowDefinitionStore
>()('looms/WorkflowDefinitions') {}

export function makeWorkflowDefinitionStore(
  definitions: ReadonlyArray<WorkflowDefinition>,
): WorkflowDefinitionStore {
  return makeDefinitionStore('workflow', definitions)
}

export const WorkflowDefinitionsLive = (definitions: ReadonlyArray<WorkflowDefinition>) =>
  Layer.succeed(WorkflowDefinitionsTag, makeWorkflowDefinitionStore(definitions))
