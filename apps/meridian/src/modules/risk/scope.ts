import { createModuleScope } from '@swirls/looms/core'

import { riskEvents } from './events'

export const riskScope = createModuleScope({
  namespace: 'risk',
  protocolVersion: '1.0.0',
  events: riskEvents,
})
