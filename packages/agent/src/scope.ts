import { defineModule, type EventOf } from '@looms/core'

import { agentCatalog } from './events'

export const agentModule = defineModule({
  namespace: 'agent',
  protocolVersion: '1.0.0',
  events: agentCatalog,
})

export type AgentEvent = EventOf<typeof agentModule>
