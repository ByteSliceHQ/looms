import { defineRuntimeModule } from '@looms/core'

import { requestApprovalEffect } from './effects'
import { approvalCatalog } from './events'
import { pendingApprovals } from './projections'

export function approval() {
  return defineRuntimeModule({
    namespace: 'approval',
    protocolVersion: '1.0.0',
    events: approvalCatalog,
    effects: { request: requestApprovalEffect },
    projections: { pendingApprovals },
  })
}
