import { createModuleScope } from '@swirls/looms/core'

import { shipmentsEvents } from './events'

export const shipmentsScope = createModuleScope({
  namespace: 'shipments',
  protocolVersion: '1.0.0',
  events: shipmentsEvents,
})
