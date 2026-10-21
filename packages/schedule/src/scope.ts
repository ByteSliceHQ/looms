import { createModuleScope, type EventOf } from '@looms/core'

import { scheduleCatalog } from './events'

export const scheduleModule = createModuleScope({
  namespace: 'schedule',
  protocolVersion: '1.0.0',
  events: scheduleCatalog,
})

export type ScheduleEvent = EventOf<typeof scheduleModule>
