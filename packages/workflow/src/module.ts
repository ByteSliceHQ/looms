import { defineRuntimeModule, fromJsonStruct, type JsonValue, type ModuleServicesContext } from '@looms/core'
import { workflowCatalog } from './catalog'
import type { WorkflowDefinition } from './definitions'
import { WorkflowDefinitionsLive } from './definitions-store'
import { workflowThread, type WorkflowState } from './thread'
import { bindWorkflowThread, runNodeEffect, scheduleEffect } from './effects'
import { nodes } from './projections'

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
    bindThread: (record) => {
      if (record.kind !== 'workflow') return
      const state = fromJsonStruct<WorkflowState>(record.state)
      const nodeStates: { [id: string]: { status: string; result: JsonValue | null } } = {}
      for (const [id, node] of Object.entries(state.nodes ?? {})) {
        nodeStates[id] = { status: node.status, result: node.result }
      }
      bindWorkflowThread(record.threadId, {
        definitionName: record.definitionName,
        nodes: nodeStates,
        input: record.input,
      })
    },
  })
}
