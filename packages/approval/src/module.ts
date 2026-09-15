import { requestApprovalEffect } from './effects'
import { pendingApprovals } from './projections'
import { approvalModule } from './scope'

export function approval() {
  return approvalModule.build({
    effects: { request: requestApprovalEffect },
    projections: { pendingApprovals },
  })
}
