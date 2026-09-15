import { createModuleScope, type EventOf } from '@looms/core'

import { agentCatalog } from './events'

export const agentModule = createModuleScope({
  namespace: 'agent',
  protocolVersion: '1.0.0',
  events: agentCatalog,
})

export type AgentEvent = EventOf<typeof agentModule>
