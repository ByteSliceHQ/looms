import { Schema } from 'effect'

import { scheduleModule } from './scope'
import { ScheduleSpecSchema } from './specs'

const RECENT_LIMIT = 20

export const ScheduleRecentSchema = Schema.Struct({
  at: Schema.Finite,
  runId: Schema.NullOr(Schema.String),
  outcome: Schema.Union([Schema.Literal('fired'), Schema.Literal('skipped')]),
  reason: Schema.optional(Schema.String),
})
export type ScheduleRecent = Schema.Schema.Type<typeof ScheduleRecentSchema>

export const ScheduleStatusSchema = Schema.Struct({
  spec: Schema.NullOr(ScheduleSpecSchema),
  status: Schema.Union([
    Schema.Literal('running'),
    Schema.Literal('paused'),
    Schema.Literal('retired'),
    Schema.Literal('completed'),
    Schema.Literal('failed'),
    Schema.Literal('cancelled'),
  ]),
  nextAt: Schema.NullOr(Schema.Finite),
  fireCount: Schema.Finite,
  recent: Schema.Array(ScheduleRecentSchema),
})
export type ScheduleStatus = Schema.Schema.Type<typeof ScheduleStatusSchema>

export const scheduleStatus = scheduleModule.projection({
  name: 'scheduleStatus',
  shape: ScheduleStatusSchema,
  initialState: {
    spec: null,
    status: 'running',
    nextAt: null,
    fireCount: 0,
    recent: [],
  },
  reduce(state, event): ScheduleStatus {
    switch (event.type) {
      case 'schedule.planned':
        return { ...state, spec: event.payload.spec, nextAt: event.payload.nextAt }

      case 'schedule.updated':
        return event.payload.spec === undefined ? state : { ...state, spec: event.payload.spec }

      case 'schedule.fired':
        return {
          ...state,
          nextAt: event.payload.nextAt,
          fireCount: state.fireCount + 1,
          recent: remember(state.recent, {
            at: event.payload.at,
            runId: event.payload.runId,
            outcome: 'fired',
          }),
        }

      case 'schedule.skipped':
        return {
          ...state,
          nextAt: event.payload.nextAt,
          recent: remember(state.recent, {
            at: event.payload.at,
            runId: null,
            outcome: 'skipped',
            reason: event.payload.reason,
          }),
        }

      case 'schedule.paused':
        return {
          ...state,
          status: state.status === 'retired' ? 'retired' : 'paused',
          nextAt: null,
        }

      case 'schedule.resumed':
        return { ...state, status: 'running' }

      case 'schedule.retired':
        return { ...state, status: 'retired', nextAt: null }

      case 'runtime.thread.completed':
        return { ...state, status: 'completed', nextAt: null }

      case 'runtime.thread.failed':
        return { ...state, status: 'failed', nextAt: null }

      case 'runtime.run.cancelled':
      case 'runtime.thread.cancelled':
        return { ...state, status: 'cancelled', nextAt: null }

      default:
        return state
    }
  },
})

function remember(recent: readonly ScheduleRecent[], item: ScheduleRecent): ScheduleRecent[] {
  const next = [...recent, item]

  return next.length > RECENT_LIMIT ? next.slice(next.length - RECENT_LIMIT) : next
}
