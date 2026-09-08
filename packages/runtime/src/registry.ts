import type { AgentDefinition, WorkflowDefinition } from '@looms/core'

export interface DefinitionRegistry {
  agents: Map<string, AgentDefinition>
  workflows: Map<string, WorkflowDefinition>
}

export function createRegistry(
  definitions: Array<AgentDefinition | WorkflowDefinition> = [],
): DefinitionRegistry {
  const agents = new Map<string, AgentDefinition>()
  const workflows = new Map<string, WorkflowDefinition>()
  for (const def of definitions) {
    if (def.kind === 'agent') agents.set(def.name, def)
    else workflows.set(def.name, def)
  }
  return { agents, workflows }
}

export function registerAgent(registry: DefinitionRegistry, def: AgentDefinition): void {
  registry.agents.set(def.name, def)
}

export function registerWorkflow(registry: DefinitionRegistry, def: WorkflowDefinition): void {
  registry.workflows.set(def.name, def)
}
