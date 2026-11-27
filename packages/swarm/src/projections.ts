import { Schema } from 'effect'

import { isWithdrawnError, parseEffectId } from '@looms/core'

import { swarmModule } from './scope'

const RECENT_LIMIT = 20

/**
 * - `idle`: waiting for the board to wake it.
 * - `active`: its run is in progress.
 * - `failed`: its latest activation could not start (see `lastError`). The swarm goes on, and the
 *   member is woken again by what reaches the board next.
 */
export const SwarmMemberStatusSchema = Schema.Struct({
  status: Schema.Union([
    Schema.Literal('idle'),
    Schema.Literal('active'),
    Schema.Literal('failed'),
  ]),
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
  /** Why the latest activation could not start, or why the latest finished run failed. */
  lastError: Schema.NullOr(Schema.String),
})
export type SwarmMemberStatus = Schema.Schema.Type<typeof SwarmMemberStatusSchema>

export const SwarmActivationSchema = Schema.Struct({
  member: Schema.String,
  runId: Schema.String,
  events: Schema.Finite,
  at: Schema.Finite,
})
export type SwarmActivation = Schema.Schema.Type<typeof SwarmActivationSchema>

/**
 * - `running`: following the board and waking members.
 * - `paused`: waking nobody until `resume()`; keeps its cursor and inboxes.
 * - `stopping`: stopped, with members still mid-run.
 * - `stopped`: waking nobody until `restart()`.
 * - `halted`: the swarm cannot go on (see `error`), such as a board that refused it. Its run is
 *   open, so `restart()` can start it again.
 * - `failed` and `cancelled`: the run itself ended. Its run id cannot be used again.
 */
export const SwarmLifecycleSchema = Schema.Union([
  Schema.Literal('running'),
  Schema.Literal('paused'),
  Schema.Literal('stopping'),
  Schema.Literal('stopped'),
  Schema.Literal('halted'),
  Schema.Literal('failed'),
  Schema.Literal('cancelled'),
])
export type SwarmLifecycle = Schema.Schema.Type<typeof SwarmLifecycleSchema>

export const SwarmStatusSchema = Schema.Struct({
  status: SwarmLifecycleSchema,
  /** Counts the swarm's starts in its run, from 1. Each `restart()` adds one. */
  generation: Schema.Finite,
  /** Why the swarm halted or failed. */
  error: Schema.NullOr(Schema.String),
  /** Times the board refused the swarm's cursor and the swarm read the log from the start. */
  resets: Schema.Finite,
  board: Schema.NullOr(Schema.String),
  cursor: Schema.NullOr(Schema.String),
  /** Board events the swarm has read. */
  eventsRead: Schema.Finite,
  members: Schema.Record(Schema.String, SwarmMemberStatusSchema),
  recent: Schema.Array(SwarmActivationSchema),
})
export type SwarmStatus = Schema.Schema.Type<typeof SwarmStatusSchema>

const ACTIVATION_TAG = /^activate:([a-z0-9-]+):(\d+)(?:@(\d+))?$/

/** The member, activation and generation an activation effect's tag names. See `threads.ts`. */
function parseActivation(
  effectId: string | null | undefined,
): { readonly member: string; readonly activation: number; readonly generation: number } | null {
  const tag = effectId ? parseEffectId(effectId)?.tag : undefined
  const match = tag === undefined ? null : ACTIVATION_TAG.exec(tag)

  if (!match) {
    return null
  }

  return {
    member: match[1] ?? '',
    activation: Number(match[2]),
    generation: match[3] === undefined ? 1 : Number(match[3]),
  }
}

function anyActive(members: SwarmStatus['members']): boolean {
  return Object.values(members).some((member) => member.status === 'active')
}

/** A swarm run at a glance: where it is on the board, and what each member is doing. */
export const swarmStatus = swarmModule.projection({
  name: 'swarmStatus',
  shape: SwarmStatusSchema,
  initialState: {
    status: 'running',
    generation: 1,
    error: null,
    resets: 0,
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
          resets: state.resets + (event.payload.reset === true ? 1 : 0),
        }

      case 'swarm.member.activated': {
        const { member, runId, events, at, activation } = event.payload

        if ((event.payload.generation ?? 1) !== state.generation) {
          return state
        }

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
              lastError: null,
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

        const members: SwarmStatus['members'] = {
          ...state.members,
          [name]: {
            ...member,
            status: 'idle',
            lastOutcome: event.payload.status,
            lastError: event.payload.error,
          },
        }

        return {
          ...state,
          status: state.status === 'stopping' && !anyActive(members) ? 'stopped' : state.status,
          members,
        }
      }

      case 'runtime.effect.failed': {
        const failed = parseActivation(event.effectId)

        if (
          !failed ||
          failed.generation !== state.generation ||
          isWithdrawnError(event.payload.error)
        ) {
          return state
        }

        const member = state.members[failed.member]

        return {
          ...state,
          members: {
            ...state.members,
            [failed.member]: {
              status: 'failed',
              activations: failed.activation,
              runId: member?.runId ?? null,
              lastOutcome: member?.lastOutcome ?? null,
              lastError: event.payload.error || 'activation failed',
            },
          },
        }
      }

      case 'swarm.paused':
        return state.status === 'running' ? { ...state, status: 'paused' } : state

      case 'swarm.resumed':
        return state.status === 'paused' ? { ...state, status: 'running' } : state

      case 'swarm.stopped':
        return state.status === 'running' || state.status === 'paused'
          ? { ...state, status: anyActive(state.members) ? 'stopping' : 'stopped' }
          : state

      case 'swarm.restarted': {
        // Members still mid-run from the earlier generation stay listed until they finish.
        const members = Object.fromEntries(
          Object.entries(state.members).filter(([, member]) => member.status === 'active'),
        )

        return {
          ...state,
          status: 'running',
          generation: state.generation + 1,
          error: null,
          board: event.payload.board ?? state.board,
          members,
        }
      }

      case 'swarm.halted':
        return event.payload.generation === state.generation
          ? { ...state, status: 'halted', error: event.payload.error }
          : state

      case 'runtime.thread.failed':
        return { ...state, status: 'failed', error: event.payload.error }

      case 'runtime.run.cancelled':
      case 'runtime.thread.cancelled':
        return { ...state, status: 'cancelled' }

      default:
        return state
    }
  },
})
