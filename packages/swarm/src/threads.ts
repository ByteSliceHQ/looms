import { Option, Schema } from 'effect'

import {
  complete,
  fail,
  invoke,
  parseEffectId,
  type DefinitionStore,
  type RuntimeEffect,
  type ThreadDefinition,
} from '@looms/core'

import { channelMatches, type BoardEvent } from './board'
import { SwarmStartSchema, type SwarmDefinition, type SwarmMember } from './definitions'
import { activateEffect, pullEffect } from './effects'
import { swarmModule } from './scope'

/** Board events a member can have queued. Older ones are dropped and counted. */
export const INBOX_LIMIT = 50

export interface SwarmMemberState {
  /** How many times this member has been woken. */
  readonly activations: number
  /** Board events waiting for the member's next activation. */
  readonly inbox: readonly BoardEvent[]
  /** The events of an activation that has been decided but has no run yet. */
  readonly batch: readonly BoardEvent[] | null
  /** The member's run in progress. */
  readonly runId: string | null
  /** The member is not woken again before this time. Set when a run of a resting member ends. */
  readonly restUntil: number | null
  /** Events that overflowed the inbox. */
  readonly dropped: number
  readonly lastError: string | null
}

export interface SwarmState {
  readonly definitionName: string
  readonly definitionVersion: string
  readonly board: string
  /** How far into the board's event log the swarm has read. */
  readonly cursor: string | null
  /** Completed pulls. Names the next pull, so each pull effect has its own tag. */
  readonly pulls: number
  /** Pulls that have failed in a row since the last one that worked. */
  readonly pullFailures: number
  /** Read the board as soon as possible. */
  readonly pullNow: boolean
  /** Otherwise read it at this time, or not until nudged when null. */
  readonly nextPullAt: number | null
  /** Something may have been written while a pull was in flight, so pull once more after it. */
  readonly dirty: boolean
  readonly members: { readonly [name: string]: SwarmMemberState }
  readonly stopped: boolean
  readonly invalid: string | null
}

const decodeStart = Schema.decodeUnknownOption(SwarmStartSchema)

const EMPTY_MEMBER: SwarmMemberState = {
  activations: 0,
  inbox: [],
  batch: null,
  runId: null,
  restUntil: null,
  dropped: 0,
  lastError: null,
}

function listens(member: SwarmMember, channel: string): boolean {
  return (member.channels ?? []).some((filter) => channelMatches(filter, channel))
}

/** Whether a board event should wake `member`. A member is never woken by its own writes. */
export function concerns(member: SwarmMember, event: BoardEvent): boolean {
  if (event.by === member.name) {
    return false
  }

  const { message, task } = event

  if (message && (event.type === 'message.posted' || event.type === 'task.created')) {
    if (message.mentions.includes(member.name)) {
      return true
    }
  }

  if (task) {
    const offered =
      task.state === 'ready' &&
      (event.type === 'task.created' ||
        event.type === 'task.ready' ||
        event.type === 'task.reopened')

    return (
      offered && (task.for === member.name || (task.for === null && listens(member, task.channel)))
    )
  }

  return (
    event.type === 'message.posted' && message !== undefined && listens(member, message.channel)
  )
}

function deliver(
  state: SwarmState,
  definition: SwarmDefinition,
  events: readonly BoardEvent[],
): SwarmState['members'] {
  const woken = definition.members.flatMap((member) => {
    const concerning = events.filter((event) => concerns(member, event))

    if (concerning.length === 0) {
      return []
    }

    const current = state.members[member.name] ?? EMPTY_MEMBER
    const inbox = [...current.inbox, ...concerning]
    const overflow = Math.max(0, inbox.length - INBOX_LIMIT)

    const next: SwarmMemberState = {
      ...current,
      inbox: inbox.slice(overflow),
      dropped: current.dropped + overflow,
    }

    return [[member.name, next] as const]
  })

  return { ...state.members, ...Object.fromEntries(woken) }
}

/** Whether the member is idle with board activity it has not been woken for. */
function waiting(member: SwarmMemberState): boolean {
  return member.batch === null && member.runId === null && member.inbox.length > 0
}

/** When the first resting member with something in its inbox may be woken, if any is resting. */
function nextRestEnd(state: SwarmState): number | null {
  const ends = Object.values(state.members).flatMap((member) =>
    waiting(member) && member.restUntil !== null ? [member.restUntil] : [],
  )

  return ends.length > 0 ? Math.min(...ends) : null
}

/**
 * Turn each idle member's inbox into its next activation. The batch is fixed here, in the
 * reducer, so the activation effect has the same input however often its thread is asked for it.
 */
function cutBatches(state: SwarmState, now: number): SwarmState {
  if (state.stopped) {
    return state
  }

  let changed = false
  const members: { [name: string]: SwarmMemberState } = {}

  for (const [name, member] of Object.entries(state.members)) {
    if (waiting(member) && (member.restUntil === null || member.restUntil <= now)) {
      changed = true

      members[name] = {
        ...member,
        activations: member.activations + 1,
        batch: member.inbox,
        inbox: [],
        restUntil: null,
      }
    } else {
      members[name] = member
    }
  }

  return changed ? { ...state, members } : state
}

/** Ask for a pull now, or after the pull in flight when one may already be reading the board. */
function requestPull(state: SwarmState): SwarmState {
  return state.pullNow ? { ...state, dirty: true } : { ...state, pullNow: true }
}

/** The longest a swarm waits before it tries an unreachable board again. */
export const MAX_PULL_BACKOFF_MS = 15 * 60_000

const PULL_BACKOFF_MS = 30_000

function pullTag(state: SwarmState, when: string): string {
  return `pull:${state.pulls}:${state.pullFailures}:${when}`
}

function activationTag(member: string, activation: number): string {
  return `activate:${member}:${activation}`
}

export function createSwarmThread(
  definitions: DefinitionStore<SwarmDefinition>,
): ThreadDefinition<SwarmState> {
  return swarmModule.thread({
    kind: 'swarm',
    input: SwarmStartSchema,
    forgetsCompletedEffects: true,
    initialState: (ctx): SwarmState => {
      const definition = definitions.get(ctx.definitionName, ctx.definitionVersion)
      const start = Option.getOrUndefined(decodeStart(ctx.input))
      const config = start && start !== null ? start : {}

      return {
        definitionName: ctx.definitionName,
        definitionVersion: ctx.definitionVersion,
        board: config.board ?? ctx.runId,
        cursor: config.after ?? null,
        pulls: 0,
        pullFailures: 0,
        pullNow: true,
        nextPullAt: null,
        dirty: false,
        members: {},
        stopped: false,
        invalid: definition
          ? null
          : `Unknown swarm definition "${ctx.definitionName}@${ctx.definitionVersion}"`,
      }
    },
    step(state, event, ctx) {
      switch (event.type) {
        case 'swarm.board.pulled': {
          if (event.payload.pull !== state.pulls) {
            return state
          }

          const definition = definitions.get(state.definitionName, state.definitionVersion)

          return cutBatches(
            {
              ...state,
              cursor: event.payload.cursor,
              pulls: state.pulls + 1,
              pullFailures: 0,
              pullNow: state.dirty || event.payload.more,
              nextPullAt: event.payload.nextPullAt,
              dirty: false,
              members: definition
                ? deliver(state, definition, event.payload.events)
                : state.members,
            },
            event.ts,
          )
        }

        case 'swarm.member.activated': {
          const member = state.members[event.payload.member]

          if (!member || member.activations !== event.payload.activation) {
            return state
          }

          return {
            ...state,
            members: {
              ...state.members,
              [event.payload.member]: {
                ...member,
                batch: null,
                runId: event.payload.runId,
                lastError: null,
              },
            },
          }
        }

        case 'runtime.child.settled': {
          const entry = Object.entries(state.members).find(
            ([, member]) => member.runId === event.payload.runId,
          )

          if (!entry) {
            return state
          }

          const [name, member] = entry

          const rest = definitions
            .get(state.definitionName, state.definitionVersion)
            ?.members.find((item) => item.name === name)?.restMs

          // The member most likely wrote to the board, so read it again before going idle.
          return cutBatches(
            requestPull({
              ...state,
              members: {
                ...state.members,
                [name]: {
                  ...member,
                  runId: null,
                  restUntil: rest === undefined ? null : event.ts + rest,
                  lastError: event.payload.error,
                },
              },
            }),
            event.ts,
          )
        }

        case 'runtime.effect.failed': {
          const tag = event.effectId ? parseEffectId(event.effectId)?.tag : undefined

          if (event.threadId === ctx.threadId && tag?.startsWith(pullTag(state, ''))) {
            // A board that refuses the swarm will refuse it again, so the swarm fails where
            // someone will see it. An unreachable board is tried again, less and less often.
            if (event.payload.nonRetryable) {
              return { ...state, invalid: event.payload.error || 'the board refused the swarm' }
            }

            const backoff = Math.min(PULL_BACKOFF_MS * 2 ** state.pullFailures, MAX_PULL_BACKOFF_MS)

            return {
              ...state,
              pullFailures: state.pullFailures + 1,
              pullNow: false,
              nextPullAt: event.ts + backoff,
            }
          }

          const entry = Object.entries(state.members).find(
            ([name, member]) =>
              member.batch !== null && tag === activationTag(name, member.activations),
          )

          if (!entry || event.threadId !== ctx.threadId) {
            return state
          }

          const [name, member] = entry

          // The activation could not start. Drop its batch so the member can be woken again.
          return cutBatches(
            {
              ...state,
              members: {
                ...state.members,
                [name]: {
                  ...member,
                  batch: null,
                  dropped: member.dropped + (member.batch?.length ?? 0),
                  lastError: event.payload.error || 'activation failed',
                },
              },
            },
            event.ts,
          )
        }

        case 'swarm.nudged':
          return state.stopped ? state : requestPull(state)

        case 'swarm.stopped': {
          const members: { [name: string]: SwarmMemberState } = {}

          for (const [name, member] of Object.entries(state.members)) {
            members[name] = { ...member, batch: null, inbox: [] }
          }

          return { ...state, stopped: true, members }
        }

        default:
          return state
      }
    },
    effects(state): RuntimeEffect[] {
      if (state.invalid) {
        return [fail(state.invalid)]
      }

      const members = Object.entries(state.members)

      if (state.stopped) {
        // Let members that are mid-run finish before the swarm completes.
        return members.some(([, member]) => member.runId !== null)
          ? []
          : [
              complete({
                activations: members.reduce((total, [, member]) => total + member.activations, 0),
              }),
            ]
      }

      const definition = {
        definitionName: state.definitionName,
        definitionVersion: state.definitionVersion,
      }

      const effects: RuntimeEffect[] = []
      const pull = { ...definition, board: state.board, after: state.cursor, pull: state.pulls }

      // A resting member is woken by the pull that follows its rest, so one is due by then.
      const restEnd = nextRestEnd(state)
      const times = [state.nextPullAt, restEnd].flatMap((at) => (at === null ? [] : [at]))

      if (state.pullNow) {
        effects.push(invoke(pullEffect, pull, pullTag(state, 'now')))
      } else if (times.length > 0) {
        const at = Math.min(...times)

        effects.push(invoke(pullEffect, pull, pullTag(state, String(at)), { at }))
      }

      for (const [name, member] of members) {
        if (member.batch !== null && member.runId === null) {
          effects.push(
            invoke(
              activateEffect,
              {
                ...definition,
                board: state.board,
                member: name,
                activation: member.activations,
                events: member.batch,
              },
              activationTag(name, member.activations),
            ),
          )
        }
      }

      return effects
    },
  })
}
