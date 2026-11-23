import { createModuleScope, type EventOf } from '@looms/core'

import { swarmCatalog } from './events'

export const swarmModule = createModuleScope({
  namespace: 'swarm',
  protocolVersion: '1.0.0',
  description: 'Agent swarms that coordinate through a shared message board.',
  events: swarmCatalog,
})

export type SwarmEvent = EventOf<typeof swarmModule>
