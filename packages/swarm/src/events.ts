import { Schema } from 'effect'

import { AttachmentSchema } from '@looms/agent'
import { defineEventCatalog } from '@looms/core'

import { BoardEventSchema, BoardMessageSchema, BoardTaskSchema, TaskClaimSchema } from './board'

/** Which board a member's call went to, and the id that pairs the result with its tool call. */
const CallFields = {
  callId: Schema.String,
  board: Schema.String,
}

export const BoardPulledPayloadSchema = Schema.Struct({
  board: Schema.String,
  /** The pull this answers. A swarm ignores a pull it is no longer waiting for. */
  pull: Schema.Finite,
  cursor: Schema.NullOr(Schema.String),
  events: Schema.Array(BoardEventSchema),
  /** The board had more events than fit in this page. */
  more: Schema.Boolean,
  /** When to poll next, or null when the swarm only pulls on a nudge. */
  nextPullAt: Schema.NullOr(Schema.Finite),
  /**
   * The board refused the swarm's cursor as one its log never issued, so this page reads the log
   * from the start. Absent on events written before boards could say so.
   */
  reset: Schema.optional(Schema.Boolean),
})

export const MemberActivatedPayloadSchema = Schema.Struct({
  board: Schema.String,
  member: Schema.String,
  /** Counts this member's activations, from 1. */
  activation: Schema.Finite,
  /** The run that carries out the activation. */
  runId: Schema.String,
  /** How many board events the member was woken for. */
  events: Schema.Finite,
  at: Schema.Finite,
  /** The swarm generation that woke the member. Absent means the first. */
  generation: Schema.optional(Schema.Finite),
})

export const SwarmRestartedPayloadSchema = Schema.Struct({
  /** Follow this board from now on. Omit to keep the current one. */
  board: Schema.optional(Schema.String),
  /**
   * Where the new generation starts reading: a board cursor, or null for the start of the log.
   * Omit to carry on from the swarm's cursor, or from the start when `board` changes.
   */
  after: Schema.optional(Schema.NullOr(Schema.String)),
})

export const SwarmHaltedPayloadSchema = Schema.Struct({
  /** Why the swarm stopped waking members. */
  error: Schema.String,
  generation: Schema.Finite,
})

export const SwarmEmptyPayloadSchema = Schema.Struct({})

export const swarmCatalog = defineEventCatalog('swarm', {
  // On the swarm's run.
  'board.pulled': BoardPulledPayloadSchema,
  'member.activated': MemberActivatedPayloadSchema,
  nudged: SwarmEmptyPayloadSchema,
  stopped: SwarmEmptyPayloadSchema,
  paused: SwarmEmptyPayloadSchema,
  resumed: SwarmEmptyPayloadSchema,
  restarted: SwarmRestartedPayloadSchema,
  halted: SwarmHaltedPayloadSchema,

  // On the run of whoever called the board: a member, or any thread that used a step.
  'message.posted': Schema.Struct({ ...CallFields, message: BoardMessageSchema }),
  'message.labeled': Schema.Struct({ ...CallFields, message: BoardMessageSchema }),
  'messages.read': Schema.Struct({ ...CallFields, messages: Schema.Array(BoardMessageSchema) }),
  /**
   * The files on one message. `attachments` is at the top of the payload so that an agent's
   * tool result shows them to the model.
   */
  'attachments.viewed': Schema.Struct({
    ...CallFields,
    message: Schema.String,
    attachments: Schema.Array(AttachmentSchema),
  }),
  'task.created': Schema.Struct({ ...CallFields, task: BoardTaskSchema }),
  'tasks.listed': Schema.Struct({ ...CallFields, tasks: Schema.Array(BoardTaskSchema) }),
  /** `claim` is null when the queue had nothing for the caller. */
  'task.claimed': Schema.Struct({ ...CallFields, claim: Schema.NullOr(TaskClaimSchema) }),
  'task.settled': Schema.Struct({ ...CallFields, task: BoardTaskSchema }),
  /** The claim with its new lease. */
  'task.renewed': Schema.Struct({ ...CallFields, claim: TaskClaimSchema }),
  'task.reopened': Schema.Struct({ ...CallFields, task: BoardTaskSchema }),
  'task.canceled': Schema.Struct({ ...CallFields, task: BoardTaskSchema }),
  /** The board refused the call. `error` makes a waiting tool call fail with this message. */
  'call.rejected': Schema.Struct({ ...CallFields, code: Schema.String, error: Schema.String }),
})
