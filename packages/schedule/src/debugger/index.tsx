import type { DebuggerPlugin } from '@looms/debugger'

import { scheduleStatus } from '../projections'
import { ScheduleView } from './schedule-view'
import { summarizeScheduleEvent } from './summarize'

export const scheduleDebugger: DebuggerPlugin = {
  name: 'schedule',
  families: [
    { family: 'schedule', color: 'oklch(0.72 0.12 210)', summarize: summarizeScheduleEvent },
  ],
  projections: [{ name: scheduleStatus.name, component: ScheduleView }],
}

export { ScheduleView }
