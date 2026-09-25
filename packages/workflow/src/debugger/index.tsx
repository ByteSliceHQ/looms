import { projectionView, type DebuggerPlugin } from '@looms/debugger'

import { nodes } from '../projections'
import { WorkflowNodesView } from './nodes-view'
import { summarizeWorkflowEvent } from './summarize'

export const workflowDebugger: DebuggerPlugin = {
  name: 'workflow',
  families: [
    { family: 'workflow', color: 'oklch(0.76 0.12 300)', summarize: summarizeWorkflowEvent },
  ],
  projections: [projectionView(nodes, WorkflowNodesView)],
}

export { WorkflowNodesView }
