import { Option, Schema } from 'effect'

import {
  emit,
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
  /** Counts the swarm's starts in this run, from 1. `restart()` begins the next one. */
  readonly generation: number
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
  /** Wakes nobody and reads nothing until resumed, keeping its cursor and inboxes. */
  readonly paused: boolean
  /** Wakes nobody and reads nothing until restarted. */
  readonly stopped: boolean
  /** Why the swarm cannot go on, such as a board that refused it. It waits for a restart. */
  readonly invalid: string | null
  /** `swarm.halted` has recorded `invalid`. */
  readonly halted: boolean
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
  if (state.stopped || state.paused || state.invalid !== null) {
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

/** When the swarm reads the board next if nothing asks it to sooner, or null if it waits. */
function nextScheduledPull(state: SwarmState): number | null {
  const times = [state.nextPullAt, nextRestEnd(state)].flatMap((at) => (at === null ? [] : [at]))

  return times.length > 0 ? Math.min(...times) : null
}

/**
 * Ask for a pull now, and for one more after the pull in flight when one may already be reading
 * the board: one asked for now, or a scheduled one whose time has come. That pull may have read
 * the board before whatever prompted this request was written to it.
 */
function requestPull(state: SwarmState, now: number): SwarmState {
  const scheduled = nextScheduledPull(state)
  const inFlight = state.pullNow || (scheduled !== null && scheduled <= now)

  return { ...state, pullNow: true, dirty: state.dirty || inFlight }
}

/** The longest a swarm waits before it tries an unreachable board again. */
export const MAX_PULL_BACKOFF_MS = 15 * 60_000

const PULL_BACKOFF_MS = 30_000

function pullTag(state: SwarmState, when: string): string {
  return `pull:${state.pulls}:${state.pullFailures}:${when}`
}

/** Activation tags of the first generation keep the form they had before generations. */
function activationTag(generation: number, member: string, activation: number): string {
  const tag = `activate:${member}:${activation}`

  return generation > 1 ? `${tag}@${generation}` : tag
}

function unknownDefinition(name: string, version: string): string {
  return `Unknown swarm definition "${name}@${version}"`
}

/**
 * The next generation. Members still mid-run keep their run, so they are not woken again before
 * it ends; everything else about them starts over.
 */
function nextGeneration(
  state: SwarmState,
  restart: { readonly board?: string; readonly after?: string | null },
  known: boolean,
): SwarmState {
  const board = restart.board ?? state.board

  const after =
    restart.after === undefined ? (board === state.board ? state.cursor : null) : restart.after

  const members: { [name: string]: SwarmMemberState } = {}

  for (const [name, member] of Object.entries(state.members)) {
    if (member.runId !== null) {
      members[name] = { ...EMPTY_MEMBER, runId: member.runId }
    }
  }

  return {
    ...state,
    generation: state.generation + 1,
    board,
    cursor: after,
    // A pull still in flight answers for the earlier generation, so it is ignored.
    pulls: state.pulls + 1,
    pullFailures: 0,
    pullNow: true,
    nextPullAt: null,
    dirty: false,
    members,
    paused: false,
    stopped: false,
    invalid: known ? null : unknownDefinition(state.definitionName, state.definitionVersion),
    halted: false,
  }
}

export function createSwarmThread(
  definitions: DefinitionStore<SwarmDefinition>,
): ThreadDefinition<SwarmState> {
  return swarmModule.thread({
    kind: 'swarm',
    input: SwarmStartSchema,
    forgetsCompletedEffects: true,
    // A failed activation is recorded on its member, and the swarm goes on.
    handlesEffectFailures: true,
    initialState: (ctx): SwarmState => {
      const definition = definitions.get(ctx.definitionName, ctx.definitionVersion)
      const start = Option.getOrUndefined(decodeStart(ctx.input))
      const config = start && start !== null ? start : {}

      return {
        generation: 1,
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
        paused: false,
        stopped: false,
        invalid: definition ? null : unknownDefinition(ctx.definitionName, ctx.definitionVersion),
        halted: false,
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

          if (
            !member ||
            member.activations !== event.payload.activation ||
            (event.payload.generation ?? 1) !== state.generation
          ) {
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
            requestPull(
              {
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
              },
              event.ts,
            ),
            event.ts,
          )
        }

        case 'runtime.effect.failed': {
          const tag = event.effectId ? parseEffectId(event.effectId)?.tag : undefined

          if (event.threadId === ctx.threadId && tag?.startsWith(pullTag(state, ''))) {
            // A board that refuses the swarm will refuse it again, so the swarm fails where
            // someone will see it. An unreachable board is tried again, less and less often.
            if (event.payload.nonRetryable) {
              return {
                ...state,
                invalid: event.payload.error || 'the board refused the swarm',
                halted: false,
              }
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
              member.batch !== null &&
              tag === activationTag(state.generation, name, member.activations),
          )

          if (!entry || event.threadId !== ctx.threadId) {
            return state
          }

          const [name, member] = entry

          // The activation could not start. Drop its batch so the member can be woken again by
          // what reaches the board next.
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
          return state.stopped || state.invalid !== null ? state : requestPull(state, event.ts)

        case 'swarm.paused':
          return state.stopped || state.invalid !== null ? state : { ...state, paused: true }

        case 'swarm.resumed':
          return state.paused
            ? cutBatches(requestPull({ ...state, paused: false }, event.ts), event.ts)
            : state

        case 'swarm.stopped': {
          if (state.invalid !== null) {
            return state
          }

          const members: { [name: string]: SwarmMemberState } = {}

          for (const [name, member] of Object.entries(state.members)) {
            members[name] = { ...member, batch: null, inbox: [] }
          }

          return { ...state, stopped: true, paused: false, members }
        }

        case 'swarm.restarted': {
          const known = definitions.get(state.definitionName, state.definitionVersion) !== undefined

          return nextGeneration(state, event.payload, known)
        }

        case 'swarm.halted':
          return event.payload.generation === state.generation ? { ...state, halted: true } : state

        default:
          return state
      }
    },
    effects(state): RuntimeEffect[] {
      // A halted, stopped or paused swarm keeps its run open and waits for a signal. Members
      // that are mid-run finish on their own.
      if (state.invalid !== null) {
        return state.halted
          ? []
          : [
              emit(
                swarmModule.input('halted', {
                  error: state.invalid,
                  generation: state.generation,
                }),
                `halt:${state.generation}`,
              ),
            ]
      }

      if (state.stopped || state.paused) {
        return []
      }

      const members = Object.entries(state.members)

      const definition = {
        definitionName: state.definitionName,
        definitionVersion: state.definitionVersion,
      }

      const effects: RuntimeEffect[] = []
      const pull = { ...definition, board: state.board, after: state.cursor, pull: state.pulls }

      // A resting member is woken by the pull that follows its rest, so one is due by then.
      const at = nextScheduledPull(state)

      if (state.pullNow) {
        effects.push(invoke(pullEffect, pull, pullTag(state, 'now')))
      } else if (at !== null) {
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
                generation: state.generation,
                events: member.batch,
              },
              activationTag(state.generation, name, member.activations),
            ),
          )
        }
      }

      return effects
    },
  })
}
