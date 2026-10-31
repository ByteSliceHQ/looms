import { createModuleScope } from '@swirls/looms/core'

import { signalsEvents } from './events'

export const signalsScope = createModuleScope({
  namespace: 'signals',
  protocolVersion: '1.0.0',
  events: signalsEvents,
})
