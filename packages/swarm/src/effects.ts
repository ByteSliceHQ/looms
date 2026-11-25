import { Clock, Effect, Schema } from 'effect'

import { AttachmentSchema } from '@looms/agent'
import {
  DEFAULT_DEFINITION_VERSION,
  RunLauncherTag,
  cleanUndefined,
  failEffect,
  typeIds,
  type EventInputOf,
  type LoomsIds,
} from '@looms/core'

import { BoardError, BoardEventSchema, BoardLabelsSchema, TaskStateSchema } from './board'
import type { Activation } from './definitions'
import { activationAttachments, activationPrompt } from './prompt'
import { swarmModule, type SwarmEvent } from './scope'
import { BoardsTag, SwarmDefinitionsTag } from './services'

const RETRY = { maxAttempts: 5, backoffMs: 1_000, maxBackoffMs: 60_000 } as const

/** Board events read per pull. A fuller board is read over several pulls. */
export const PULL_LIMIT = 50

const DefinitionFields = {
  definitionName: Schema.String,
  definitionVersion: Schema.String,
}

const PullInputSchema = Schema.Struct({
  ...DefinitionFields,
  board: Schema.String,
  after: Schema.NullOr(Schema.String),
  pull: Schema.Finite,
})

const ActivateInputSchema = Schema.Struct({
  ...DefinitionFields,
  board: Schema.String,
  member: Schema.String,
  activation: Schema.Finite,
  /** Absent on activations decided before generations, which belong to the first. */
  generation: Schema.optional(Schema.Finite),
  events: Schema.Array(BoardEventSchema),
})

export const pullEffect = swarmModule.effect({
  type: 'swarm.pull',
  placement: 'local',
  input: PullInputSchema,
  retry: RETRY,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const boards = yield* BoardsTag
      const definitions = yield* SwarmDefinitionsTag
      const now = yield* Clock.currentTimeMillis

      const definition = yield* definitions.resolve(input.definitionName, input.definitionVersion)

      const read = (after: string | undefined) =>
        boards.call(input.board, ctx, (board) => board.events({ after, limit: PULL_LIMIT }))

      // A cursor the board does not recognise belongs to a log that is gone, such as a board
      // that was reset. Waiting on it would wait forever, so read the new log from its start.
      const { page, reset } = yield* read(input.after ?? undefined).pipe(
        Effect.map((found) => ({ page: found, reset: false })),
        Effect.catchIf(
          (refusal) =>
            refusal instanceof BoardError &&
            refusal.code === 'cursor_unknown' &&
            input.after !== null,
          () => read(undefined).pipe(Effect.map((found) => ({ page: found, reset: true }))),
        ),
        // The board will refuse the next attempt too, so fail now and let the swarm halt.
        Effect.catchTag('BoardError', (refusal) =>
          failEffect({ error: `${refusal.code}: ${refusal.message}`, nonRetryable: true }),
        ),
      )

      const interval = definition?.pollIntervalMs ?? null

      return [
        swarmModule.input(
          'board.pulled',
          {
            board: input.board,
            pull: input.pull,
            cursor: page.cursor,
            events: page.events,
            more: page.more,
            nextPullAt: interval === null ? null : now + interval,
            reset,
          },
          { threadId: ctx.threadId },
        ),
      ]
    }),
})

export interface ActivationRef {
  readonly swarmRunId: string
  readonly member: string
  /** The member's activation within its generation, from 1. */
  readonly activation: number
  /** The swarm generation, from 1. Default 1. */
  readonly generation?: number
}

/**
 * The run id of a member's activation, in the host's id format. Derived from the swarm's run id,
 * its generation, the member and the activation, so a retried activation starts the same run, a
 * host can find a member's run, and a restarted swarm never reuses an earlier generation's ids.
 * The first generation's ids are the ones swarms had before generations.
 */
export function activationRunId(ref: ActivationRef, ids: LoomsIds = typeIds): string {
  const generation = ref.generation ?? 1
  const parts = [ref.swarmRunId, ref.member, ref.activation]

  return ids.derive('run', generation > 1 ? [...parts, generation] : parts)
}

export const activateEffect = swarmModule.effect({
  type: 'swarm.activate',
  placement: 'local',
  input: ActivateInputSchema,
  retry: RETRY,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const definitions = yield* SwarmDefinitionsTag
      const launcher = yield* RunLauncherTag
      const now = yield* Clock.currentTimeMillis

      const definition = yield* definitions.resolve(input.definitionName, input.definitionVersion)
      const member = definition?.members.find((item) => item.name === input.member)

      if (!definition || !member) {
        return yield* failEffect({
          error: `Swarm "${input.definitionName}@${input.definitionVersion}" has no member "${input.member}"`,
          nonRetryable: true,
        })
      }

      const generation = input.generation ?? 1

      const runId = activationRunId(
        { swarmRunId: ctx.runId, member: member.name, activation: input.activation, generation },
        ctx.ids,
      )

      const attachments = activationAttachments(input.events)

      const activation: Activation = {
        prompt: activationPrompt(definition, member, input.events),
        attachments: attachments.length > 0 ? attachments : undefined,
        swarm: {
          name: definition.name,
          runId: ctx.runId,
          board: input.board,
          member: member.name,
          activation: input.activation,
        },
        events: input.events,
      }

      yield* launcher.launch({
        runId,
        kind: member.agent.kind,
        definitionName: member.agent.name,
        definitionVersion: member.agent.version ?? DEFAULT_DEFINITION_VERSION,
        input: cleanUndefined(activation),
        idempotencyKey: runId,
      })

      return [
        swarmModule.input(
          'member.activated',
          {
            board: input.board,
            member: member.name,
            activation: input.activation,
            runId,
            events: input.events.length,
            at: now,
            generation,
          },
          { threadId: ctx.threadId },
        ),
      ]
    }),
})

/** Who is calling which board. `callId` pairs the resulting event with the caller's wait. */
const CallerFields = {
  callId: Schema.String,
  board: Schema.String,
  as: Schema.String,
}

export const PostArgsSchema = Schema.Struct({
  channel: Schema.String,
  text: Schema.String,
  labels: Schema.optional(BoardLabelsSchema),
  attachments: Schema.optional(Schema.Array(AttachmentSchema)),
})

export const ReplyArgsSchema = Schema.Struct({
  /** Any message of the thread to reply in. */
  to: Schema.String,
  text: Schema.String,
  attachments: Schema.optional(Schema.Array(AttachmentSchema)),
})

export const ViewArgsSchema = Schema.Struct({
  /** The message whose files to look at. A task's id is the id of its root message. */
  message: Schema.String,
})

export const ReadArgsSchema = Schema.Struct({
  channel: Schema.optional(Schema.String),
  thread: Schema.optional(Schema.String),
  by: Schema.optional(Schema.String),
  /** Only messages that mention the caller. */
  mentionsMe: Schema.optional(Schema.Boolean),
  after: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Finite),
})

export const LabelArgsSchema = Schema.Struct({
  message: Schema.String,
  set: Schema.optional(BoardLabelsSchema),
  unset: Schema.optional(Schema.Array(Schema.String)),
  if: Schema.optional(Schema.Record(Schema.String, Schema.NullOr(Schema.String))),
})

export const CreateTaskArgsSchema = Schema.Struct({
  channel: Schema.String,
  text: Schema.String,
  for: Schema.optional(Schema.String),
  needs: Schema.optional(Schema.Array(Schema.String)),
  attachments: Schema.optional(Schema.Array(AttachmentSchema)),
})

export const ListTasksArgsSchema = Schema.Struct({
  channel: Schema.optional(Schema.String),
  state: Schema.optional(TaskStateSchema),
  for: Schema.optional(Schema.String),
})

export const ClaimTaskArgsSchema = Schema.Struct({
  task: Schema.optional(Schema.String),
  channel: Schema.optional(Schema.String),
  leaseMs: Schema.optional(Schema.Finite),
})

export const SettleTaskArgsSchema = Schema.Struct({
  task: Schema.String,
  token: Schema.String,
  outcome: Schema.Union([
    Schema.Literal('completed'),
    Schema.Literal('failed'),
    Schema.Literal('blocked'),
    Schema.Literal('released'),
  ]),
  note: Schema.optional(Schema.String),
})

export const RenewTaskArgsSchema = Schema.Struct({
  task: Schema.String,
  token: Schema.String,
  leaseMs: Schema.optional(Schema.Finite),
})

export const ChangeTaskArgsSchema = Schema.Struct({
  task: Schema.String,
  note: Schema.optional(Schema.String),
})

/**
 * The idempotency key of a board write. An effect id is only unique within its run, and one
 * board serves many runs, so the key names the run too.
 */
function writeKey(ctx: { readonly runId: string; readonly effectId: string }): string {
  return `${ctx.runId}:${ctx.effectId}`
}

interface Caller {
  readonly callId: string
  readonly board: string
}

/** A refusal is an answer, not a fault: record it so the caller's wait resolves with the error. */
function rejected(caller: Caller, threadId: string, error: BoardError): EventInputOf<SwarmEvent> {
  return swarmModule.input(
    'call.rejected',
    { callId: caller.callId, board: caller.board, code: error.code, error: error.message },
    { threadId },
  )
}

function answered<R>(
  caller: Caller,
  threadId: string,
  call: Effect.Effect<EventInputOf<SwarmEvent>, BoardError | Error, R>,
): Effect.Effect<ReadonlyArray<EventInputOf<SwarmEvent>>, Error, R> {
  return call.pipe(
    Effect.map((event) => [event]),
    Effect.catchTag('BoardError', (error) => Effect.succeed([rejected(caller, threadId, error)])),
  )
}

export const postEffect = swarmModule.effect({
  type: 'swarm.post',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...PostArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const message = yield* boards.call(input.board, ctx, (board) =>
          board.post({
            by: input.as,
            channel: input.channel,
            text: input.text,
            labels: input.labels,
            attachments: input.attachments,
            key: writeKey(ctx),
          }),
        )

        return swarmModule.input(
          'message.posted',
          { callId: input.callId, board: input.board, message },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const replyEffect = swarmModule.effect({
  type: 'swarm.reply',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ReplyArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const message = yield* boards.call(input.board, ctx, (board) =>
          board.reply({
            by: input.as,
            to: input.to,
            text: input.text,
            attachments: input.attachments,
            key: writeKey(ctx),
          }),
        )

        return swarmModule.input(
          'message.posted',
          { callId: input.callId, board: input.board, message },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const readEffect = swarmModule.effect({
  type: 'swarm.read',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ReadArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const messages = yield* boards.call(input.board, ctx, (board) =>
          board.messages({
            channel: input.channel,
            thread: input.thread,
            by: input.by,
            mentions: input.mentionsMe ? input.as : undefined,
            after: input.after,
            limit: input.limit,
          }),
        )

        return swarmModule.input(
          'messages.read',
          { callId: input.callId, board: input.board, messages },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const viewEffect = swarmModule.effect({
  type: 'swarm.view',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ViewArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const found = yield* boards.call(input.board, ctx, (board) =>
          board.messages({ id: input.message }),
        )

        const message = found[0]

        if (!message) {
          return yield* new BoardError({
            code: 'message_not_found',
            message: `No message "${input.message}"`,
          })
        }

        return swarmModule.input(
          'attachments.viewed',
          {
            callId: input.callId,
            board: input.board,
            message: message.id,
            attachments: message.attachments,
          },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const labelEffect = swarmModule.effect({
  type: 'swarm.label',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...LabelArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const message = yield* boards.call(input.board, ctx, (board) =>
          board.label({
            by: input.as,
            message: input.message,
            set: input.set,
            unset: input.unset,
            if: input.if,
          }),
        )

        return swarmModule.input(
          'message.labeled',
          { callId: input.callId, board: input.board, message },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const createTaskEffect = swarmModule.effect({
  type: 'swarm.createTask',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...CreateTaskArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const task = yield* boards.call(input.board, ctx, (board) =>
          board.createTask({
            by: input.as,
            channel: input.channel,
            text: input.text,
            for: input.for,
            needs: input.needs,
            attachments: input.attachments,
            key: writeKey(ctx),
          }),
        )

        return swarmModule.input(
          'task.created',
          { callId: input.callId, board: input.board, task },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const listTasksEffect = swarmModule.effect({
  type: 'swarm.listTasks',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ListTasksArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const tasks = yield* boards.call(input.board, ctx, (board) =>
          board.tasks({ channel: input.channel, state: input.state, for: input.for }),
        )

        return swarmModule.input(
          'tasks.listed',
          { callId: input.callId, board: input.board, tasks },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

/**
 * Not retried: a claim that took effect but whose answer was lost would be refused on a second
 * attempt, and the lease returns the task to the queue on its own.
 */
export const claimTaskEffect = swarmModule.effect({
  type: 'swarm.claimTask',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ClaimTaskArgsSchema.fields }),
  retry: { maxAttempts: 1 },
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const claim = yield* boards.call(input.board, ctx, (board) =>
          board.claim({
            by: input.as,
            task: input.task,
            channel: input.channel,
            leaseMs: input.leaseMs,
          }),
        )

        return swarmModule.input(
          'task.claimed',
          { callId: input.callId, board: input.board, claim },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

export const settleTaskEffect = swarmModule.effect({
  type: 'swarm.settleTask',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...SettleTaskArgsSchema.fields }),
  retry: { maxAttempts: 1 },
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const task = yield* boards.call(input.board, ctx, (board) =>
          board.settle({
            task: input.task,
            token: input.token,
            outcome: input.outcome,
            note: input.note,
          }),
        )

        return swarmModule.input(
          'task.settled',
          { callId: input.callId, board: input.board, task },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

/** Retried: renewing twice with a token that still holds only extends the same lease. */
export const renewTaskEffect = swarmModule.effect({
  type: 'swarm.renewTask',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...RenewTaskArgsSchema.fields }),
  retry: RETRY,
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const claim = yield* boards.call(input.board, ctx, (board) =>
          board.renew({ task: input.task, token: input.token, leaseMs: input.leaseMs }),
        )

        return swarmModule.input(
          'task.renewed',
          { callId: input.callId, board: input.board, claim },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

/** Not retried: a second attempt at a reopen that took effect would be refused. */
export const reopenTaskEffect = swarmModule.effect({
  type: 'swarm.reopenTask',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ChangeTaskArgsSchema.fields }),
  retry: { maxAttempts: 1 },
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const task = yield* boards.call(input.board, ctx, (board) =>
          board.reopen({ by: input.as, task: input.task, note: input.note }),
        )

        return swarmModule.input(
          'task.reopened',
          { callId: input.callId, board: input.board, task },
          { threadId: ctx.threadId },
        )
      }),
    ),
})

/** Not retried: a second attempt at a cancel that took effect would be refused. */
export const cancelTaskEffect = swarmModule.effect({
  type: 'swarm.cancelTask',
  placement: 'local',
  input: Schema.Struct({ ...CallerFields, ...ChangeTaskArgsSchema.fields }),
  retry: { maxAttempts: 1 },
  execute: (input, ctx) =>
    answered(
      input,
      ctx.threadId,
      Effect.gen(function* () {
        const boards = yield* BoardsTag

        const task = yield* boards.call(input.board, ctx, (board) =>
          board.cancel({ by: input.as, task: input.task, note: input.note }),
        )

        return swarmModule.input(
          'task.canceled',
          { callId: input.callId, board: input.board, task },
          { threadId: ctx.threadId },
        )
      }),
    ),
})
