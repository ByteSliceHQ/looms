import { createModuleScope } from '@swirls/looms/core'

import { executionEvents } from './events'

export const executionScope = createModuleScope({
  namespace: 'execution',
  protocolVersion: '1.0.0',
  events: executionEvents,
})
