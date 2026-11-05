import { createModuleScope, type EventOf } from '@looms/core'

import { scheduleCatalog } from './events'

export const scheduleModule = createModuleScope({
  namespace: 'schedule',
  protocolVersion: '1.0.0',
  description: 'Cron, interval, and one-shot fires that start a run.',
  events: scheduleCatalog,
})

export type ScheduleEvent = EventOf<typeof scheduleModule>
