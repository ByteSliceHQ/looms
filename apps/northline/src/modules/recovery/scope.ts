import { createModuleScope } from '@swirls/looms/core'

import { recoveryEvents } from './events'

export const recoveryScope = createModuleScope({
  namespace: 'recovery',
  protocolVersion: '1.0.0',
  events: recoveryEvents,
})
