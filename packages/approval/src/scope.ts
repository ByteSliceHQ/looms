import { createModuleScope, type EventOf } from '@looms/core'

import { approvalCatalog } from './events'

export const approvalModule = createModuleScope({
  namespace: 'approval',
  protocolVersion: '1.0.0',
  events: approvalCatalog,
})

export type ApprovalEvent = EventOf<typeof approvalModule>
