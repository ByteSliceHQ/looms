import { agentDebugger } from '@looms/agent/debugger'
import { approvalDebugger } from '@looms/approval/debugger'
import type { DebuggerPlugin } from '@looms/debugger'
import { scheduleDebugger } from '@looms/schedule/debugger'
import { swarmDebugger } from '@looms/swarm/debugger'
import { workflowDebugger } from '@looms/workflow/debugger'

export const debuggerPlugins: readonly DebuggerPlugin[] = [
  agentDebugger,
  workflowDebugger,
  approvalDebugger,
  scheduleDebugger,
  swarmDebugger,
]
