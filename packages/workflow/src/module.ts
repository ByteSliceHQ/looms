import type { ModuleServicesContext } from '@looms/core'

import type { WorkflowDefinition } from './definitions'
import { WorkflowDefinitionsLive } from './definitions-store'
import { runNodeEffect, scheduleEffect } from './effects'
import { nodes } from './projections'
import { workflowModule } from './scope'
import { workflowThread } from './threads'

function workflowDefinitions(ctx: ModuleServicesContext): WorkflowDefinition[] {
  const found: WorkflowDefinition[] = []

  for (const registered of ctx.definitions) {
    if (registered.value.kind !== 'workflow') {
      continue
    }

    // SAFETY: definitions with kind 'workflow' are produced by defineWorkflow.
    found.push(registered.value as WorkflowDefinition)
  }

  return found
}

export function workflow() {
  return workflowModule.build({
    threads: { workflow: workflowThread },
    effects: {
      schedule: scheduleEffect,
      runNode: runNodeEffect,
    },
    projections: { nodes },
    services: (ctx) => WorkflowDefinitionsLive(workflowDefinitions(ctx)),
  })
}
