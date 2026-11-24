import { Option, Schema } from 'effect'

import { AttachmentSchema } from '@looms/agent'
import {
  DEFAULT_DEFINITION_VERSION,
  createKind,
  type DefinitionRef,
  type JsonValue,
} from '@looms/core'

import { BoardEventSchema } from './board'

const swarmKind = createKind('swarm')

const MEMBER_NAME = /^[a-z][a-z0-9-]*$/

export const DEFAULT_POLL_INTERVAL_MS = 60_000

export const SwarmStartSchema = Schema.Union([
  Schema.Struct({
    /** The board this swarm follows. Defaults to the swarm's run id. */
    board: Schema.optional(Schema.String),
    /** Start after this board cursor. Omit to read the board's log from the start. */
    after: Schema.optional(Schema.String),
  }),
  Schema.Null,
])
export type SwarmStart = Schema.Schema.Type<typeof SwarmStartSchema>

/** One agent in a swarm. Its name is how it signs board messages and how others `@mention` it. */
export interface SwarmMember {
  readonly name: string
  /** What the swarm starts when the board has something for this member. */
  readonly agent: DefinitionRef
  /** Told to the other members so they know what to hand over. */
  readonly description?: string
  /**
   * Channel filters the member listens to: `support` for one channel, `support/` for a subtree.
   * The member is woken for every message there and for unassigned tasks that become ready
   * there. Without channels it is woken only when mentioned or assigned a task.
   */
  readonly channels?: readonly string[]
}

export interface SwarmDefinition<TName extends string = string> extends DefinitionRef {
  readonly kind: 'swarm'
  readonly name: TName
  readonly version: string
  readonly description?: string
  readonly input: typeof SwarmStartSchema
  readonly members: readonly SwarmMember[]
  /** Added to every member's activation prompt. */
  readonly instructions?: string
  /**
   * How often the swarm reads the board when nothing nudges it. `null` reads only on a nudge and
   * after a member finishes, for hosts that signal `nudge()` on every outside write.
   */
  readonly pollIntervalMs: number | null
}

export type AnySwarmDefinition = SwarmDefinition

export function defineSwarm<TName extends string>(def: {
  readonly name: TName
  readonly version?: string
  readonly description?: string
  readonly members: readonly SwarmMember[]
  readonly instructions?: string
  readonly pollIntervalMs?: number | null
}): SwarmDefinition<TName> {
  const names = new Set<string>()

  for (const member of def.members) {
    if (!MEMBER_NAME.test(member.name)) {
      throw new Error(
        `Swarm member name "${member.name}" must be lowercase letters, digits and hyphens`,
      )
    }

    if (names.has(member.name)) {
      throw new Error(`Swarm "${def.name}" lists member "${member.name}" twice`)
    }

    names.add(member.name)
  }

  return swarmKind.define({
    ...def,
    version: def.version ?? DEFAULT_DEFINITION_VERSION,
    input: SwarmStartSchema,
    pollIntervalMs:
      def.pollIntervalMs === undefined ? DEFAULT_POLL_INTERVAL_MS : def.pollIntervalMs,
  })
}

/** The input of a member's run: who it is, which board it is on, and why it was woken. */
export const ActivationSchema = Schema.Struct({
  /** Becomes the agent's first user message. */
  prompt: Schema.String,
  swarm: Schema.Struct({
    name: Schema.String,
    runId: Schema.String,
    board: Schema.String,
    member: Schema.String,
    activation: Schema.Finite,
  }),
  events: Schema.Array(BoardEventSchema),
  /** Files on the messages that woke the member. They travel with its first user message. */
  attachments: Schema.optional(Schema.Array(AttachmentSchema)),
})
export type Activation = Schema.Schema.Type<typeof ActivationSchema>

const decodeActivation = Schema.decodeUnknownOption(ActivationSchema)

/** The activation in a member run's input, or null when the run was not started by a swarm. */
export function readActivation(input: JsonValue | undefined): Activation | null {
  return input === undefined ? null : Option.getOrNull(decodeActivation(input))
}
