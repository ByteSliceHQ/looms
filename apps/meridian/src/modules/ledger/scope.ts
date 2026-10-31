import { createModuleScope } from '@swirls/looms/core'

import { executionEvents } from '../execution/events'
import { ledgerEvents } from './events'

export const ledgerScope = createModuleScope({
  namespace: 'ledger',
  protocolVersion: '1.0.0',
  events: ledgerEvents,
  observes: [executionEvents],
})
