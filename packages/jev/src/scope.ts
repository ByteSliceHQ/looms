import { createModuleScope, type EventOf } from '@looms/core'

import { jevCatalog } from './events'

export const jevModule = createModuleScope({
  namespace: 'jev',
  protocolVersion: '1.0.0',
  events: jevCatalog,
})

export type JevEvent = EventOf<typeof jevModule>
