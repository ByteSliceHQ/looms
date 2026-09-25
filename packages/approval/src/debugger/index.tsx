import { defineDebuggerPlugin, projectionView } from '@looms/debugger'

import { pendingApprovals } from '../projections'
import { ApprovalsView } from './approvals-view'
import { summarizeApprovalEvent } from './summarize'

export const approvalDebugger = defineDebuggerPlugin({
  name: 'approval',
  families: [
    {
      family: 'approval',
      prefix: 'approval.',
      color: 'oklch(0.8 0.14 85)',
      summarize: summarizeApprovalEvent,
    },
  ],
  projections: [projectionView(pendingApprovals, ApprovalsView)],
})

export { ApprovalsView }
