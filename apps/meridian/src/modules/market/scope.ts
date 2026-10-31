import { createModuleScope } from '@swirls/looms/core'

import { marketEvents } from './events'

export const marketScope = createModuleScope({
  namespace: 'market',
  protocolVersion: '1.0.0',
  events: marketEvents,
})
