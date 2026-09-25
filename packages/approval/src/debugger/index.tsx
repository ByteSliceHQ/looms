import type { DebuggerPlugin } from '@looms/debugger'

import { pendingApprovals } from '../projections'
import { ApprovalsView } from './approvals-view'
import { summarizeApprovalEvent } from './summarize'

export const approvalDebugger: DebuggerPlugin = {
  name: 'approval',
  families: [
    { family: 'approval', color: 'oklch(0.72 0.15 45)', summarize: summarizeApprovalEvent },
  ],
  projections: [{ name: pendingApprovals.name, component: ApprovalsView }],
}

export { ApprovalsView }
