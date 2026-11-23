import { Schema } from 'effect'

import { swarmModule } from './scope'

const RECENT_LIMIT = 20

export const SwarmMemberStatusSchema = Schema.Struct({
  status: Schema.Union([Schema.Literal('idle'), Schema.Literal('active')]),
  activations: Schema.Finite,
  /** The member's latest run, in progress or finished. */
  runId: Schema.NullOr(Schema.String),
  /** How the latest finished run ended. */
  lastOutcome: Schema.NullOr(
    Schema.Union([
      Schema.Literal('completed'),
      Schema.Literal('failed'),
      Schema.Literal('cancelled'),
    ]),
  ),
})
export type SwarmMemberStatus = Schema.Schema.Type<typeof SwarmMemberStatusSchema>

export const SwarmActivationSchema = Schema.Struct({
  member: Schema.String,
  runId: Schema.String,
  events: Schema.Finite,
  at: Schema.Finite,
})
export type SwarmActivation = Schema.Schema.Type<typeof SwarmActivationSchema>

export const SwarmStatusSchema = Schema.Struct({
  status: Schema.Union([
    Schema.Literal('running'),
    Schema.Literal('stopping'),
    Schema.Literal('completed'),
    Schema.Literal('failed'),
    Schema.Literal('cancelled'),
  ]),
  board: Schema.NullOr(Schema.String),
  cursor: Schema.NullOr(Schema.String),
  /** Board events the swarm has read. */
  eventsRead: Schema.Finite,
  members: Schema.Record(Schema.String, SwarmMemberStatusSchema),
  recent: Schema.Array(SwarmActivationSchema),
})
export type SwarmStatus = Schema.Schema.Type<typeof SwarmStatusSchema>

/** A swarm run at a glance: where it is on the board, and what each member is doing. */
export const swarmStatus = swarmModule.projection({
  name: 'swarmStatus',
  shape: SwarmStatusSchema,
  initialState: {
    status: 'running',
    board: null,
    cursor: null,
    eventsRead: 0,
    members: {},
    recent: [],
  },
  reduce(state, event): SwarmStatus {
    switch (event.type) {
      case 'swarm.board.pulled':
        return {
          ...state,
          board: event.payload.board,
          cursor: event.payload.cursor,
          eventsRead: state.eventsRead + event.payload.events.length,
        }

      case 'swarm.member.activated': {
        const { member, runId, events, at, activation } = event.payload
        const recent = [...state.recent, { member, runId, events, at }]

        return {
          ...state,
          members: {
            ...state.members,
            [member]: {
              status: 'active',
              activations: activation,
              runId,
              lastOutcome: state.members[member]?.lastOutcome ?? null,
            },
          },
          recent: recent.slice(Math.max(0, recent.length - RECENT_LIMIT)),
        }
      }

      case 'runtime.child.settled': {
        const entry = Object.entries(state.members).find(
          ([, member]) => member.status === 'active' && member.runId === event.payload.runId,
        )

        if (!entry) {
          return state
        }

        const [name, member] = entry

        return {
          ...state,
          members: {
            ...state.members,
            [name]: { ...member, status: 'idle', lastOutcome: event.payload.status },
          },
        }
      }

      case 'swarm.stopped':
        return state.status === 'running' ? { ...state, status: 'stopping' } : state

      case 'runtime.thread.completed':
        return { ...state, status: 'completed' }

      case 'runtime.thread.failed':
        return { ...state, status: 'failed' }

      case 'runtime.run.cancelled':
      case 'runtime.thread.cancelled':
        return { ...state, status: 'cancelled' }

      default:
        return state
    }
  },
})
