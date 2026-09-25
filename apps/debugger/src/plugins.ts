import { agentDebugger } from '@looms/agent/debugger'
import { approvalDebugger } from '@looms/approval/debugger'
import type { DebuggerPlugin } from '@looms/debugger'
import { workflowDebugger } from '@looms/workflow/debugger'

export const debuggerPlugins: readonly DebuggerPlugin[] = [
  agentDebugger,
  workflowDebugger,
  approvalDebugger,
]
