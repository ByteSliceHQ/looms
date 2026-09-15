import { createModuleScope, type EventOf } from '@looms/core'

import { workflowCatalog } from './events'

export const workflowModule = createModuleScope({
  namespace: 'workflow',
  protocolVersion: '1.0.0',
  events: workflowCatalog,
})

export type WorkflowEvent = EventOf<typeof workflowModule>
