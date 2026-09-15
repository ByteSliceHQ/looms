import { defineModule } from '@looms/core'
import { requestApprovalEffect } from './effects'
import { pendingApprovals } from './projections'
import { approvalModule } from './scope'

export function approval() {
  return defineModule(approvalModule, () => ({
    effects: { request: requestApprovalEffect },
    projections: { pendingApprovals },
  }))
}
