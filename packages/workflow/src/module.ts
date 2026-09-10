import { defineRuntimeModule, type ModuleServicesContext } from '@looms/core'

import { workflowCatalog } from './catalog'
import type { WorkflowDefinition } from './definitions'
import { WorkflowDefinitionsLive } from './definitions-store'
import { runNodeEffect, scheduleEffect } from './effects'
import { nodes } from './projections'
import { workflowThread } from './thread'

function workflowDefinitions(ctx: ModuleServicesContext): WorkflowDefinition[] {
  const found: WorkflowDefinition[] = []
  for (const registered of ctx.definitions) {
    if (registered.value.kind !== 'workflow') continue
    // SAFETY: definitions with kind 'workflow' are produced by defineWorkflow.
    found.push(registered.value as WorkflowDefinition)
  }
  return found
}

export function workflow() {
  return defineRuntimeModule({
    namespace: 'workflow',
    protocolVersion: '1.0.0',
    events: workflowCatalog,
    threads: { workflow: workflowThread },
    effects: {
      schedule: scheduleEffect,
      runNode: runNodeEffect,
    },
    projections: { nodes },
    services: (ctx) => WorkflowDefinitionsLive(workflowDefinitions(ctx)),
  })
}
