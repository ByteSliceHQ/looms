import { Schema } from 'effect'

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
})

export const SwarmEmptyPayloadSchema = Schema.Struct({})

export const swarmCatalog = defineEventCatalog('swarm', {
  // On the swarm's run.
  'board.pulled': BoardPulledPayloadSchema,
  'member.activated': MemberActivatedPayloadSchema,
  nudged: SwarmEmptyPayloadSchema,
  stopped: SwarmEmptyPayloadSchema,

  // On the run of whoever called the board: a member, or any thread that used a step.
  'message.posted': Schema.Struct({ ...CallFields, message: BoardMessageSchema }),
  'message.labeled': Schema.Struct({ ...CallFields, message: BoardMessageSchema }),
  'messages.read': Schema.Struct({ ...CallFields, messages: Schema.Array(BoardMessageSchema) }),
  'task.created': Schema.Struct({ ...CallFields, task: BoardTaskSchema }),
  'tasks.listed': Schema.Struct({ ...CallFields, tasks: Schema.Array(BoardTaskSchema) }),
  /** `claim` is null when the queue had nothing for the caller. */
  'task.claimed': Schema.Struct({ ...CallFields, claim: Schema.NullOr(TaskClaimSchema) }),
  'task.settled': Schema.Struct({ ...CallFields, task: BoardTaskSchema }),
  /** The board refused the call. `error` makes a waiting tool call fail with this message. */
  'call.rejected': Schema.Struct({ ...CallFields, code: Schema.String, error: Schema.String }),
})
