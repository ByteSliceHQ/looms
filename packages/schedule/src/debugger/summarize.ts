import {
  jsonFields,
  jsonNumberText,
  jsonText,
  type DebuggerEvent,
  type EventSummary,
} from '@looms/debugger'

import { describeSpec, type ScheduleSpec } from '../specs'

export function summarizeScheduleEvent(event: DebuggerEvent): EventSummary | undefined {
  const payload = jsonFields(event.payload)

  switch (event.type) {
    case 'schedule.planned':
      return { title: 'fire planned', detail: jsonNumberText(payload.nextAt) }
    case 'schedule.fired':
      return {
        title: payload.manual === true ? 'fired manually' : 'fired',
        detail: jsonText(payload.runId),
      }
    case 'schedule.skipped':
      return { title: 'fire skipped', detail: jsonText(payload.reason) }
    case 'schedule.updated':
      return {
        title: 'schedule updated',
        detail: payload.spec === undefined ? undefined : specDetail(payload.spec),
      }
    case 'schedule.paused':
      return { title: 'schedule paused' }
    case 'schedule.resumed':
      return { title: 'schedule resumed' }
    case 'schedule.retired':
      return { title: 'schedule retired' }
    case 'schedule.triggered':
      return { title: 'manual fire requested' }
    case 'schedule.rejected':
      return { title: 'update rejected', detail: jsonText(payload.reason) }
    default:
      return undefined
  }
}

function specDetail(value: DebuggerEvent['payload']): string | undefined {
  if (!isSpec(value)) {
    return undefined
  }

  return describeSpec(value)
}

function isSpec(value: DebuggerEvent['payload']): value is ScheduleSpec {
  const fields = jsonFields(value)

  return fields.type === 'cron' || fields.type === 'every' || fields.type === 'once'
}
