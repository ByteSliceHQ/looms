import { createModuleScope, type EventOf } from '@looms/core'

import { agentCatalog } from './events'

export const agentModule = createModuleScope({
  namespace: 'agent',
  protocolVersion: '1.0.0',
  description: 'Conversational and tool-using model runs.',
  events: agentCatalog,
})

export type AgentEvent = EventOf<typeof agentModule>
