import { createModuleScope, type EventOf } from '@looms/core'

import { approvalCatalog } from './events'

export const approvalModule = createModuleScope({
  namespace: 'approval',
  protocolVersion: '1.0.0',
  description: 'Human gates that park a run until someone decides.',
  events: approvalCatalog,
})

export type ApprovalEvent = EventOf<typeof approvalModule>
