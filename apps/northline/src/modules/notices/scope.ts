import { createModuleScope } from '@swirls/looms/core'

import { noticesEvents } from './events'

export const noticesScope = createModuleScope({
  namespace: 'notices',
  protocolVersion: '1.0.0',
  events: noticesEvents,
})
