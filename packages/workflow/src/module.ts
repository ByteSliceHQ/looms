import { defineModule, makeDefinitionStore } from '@looms/core'

import type { WorkflowDefinition } from './definitions'
import { WorkflowDefinitionsLive } from './definitions-store'
import { runNodeEffect, scheduleEffect } from './effects'
import { nodes } from './projections'
import { workflowModule } from './scope'
import { workflowThread } from './threads'

export interface WorkflowModuleOptions {
  readonly definitions?: readonly WorkflowDefinition[]
}

export function workflow(options: WorkflowModuleOptions = {}) {
  const listed = options.definitions ?? []
  const definitions = makeDefinitionStore('workflow', listed)

  return defineModule(workflowModule, () => ({
    definitions: listed,
    threads: { workflow: workflowThread },
    effects: {
      schedule: scheduleEffect,
      runNode: runNodeEffect,
    },
    projections: { nodes },
    services: () => WorkflowDefinitionsLive(definitions),
    bindHost(host) {
      definitions.useResolver(host.definitionResolver)
    },
  }))
}
