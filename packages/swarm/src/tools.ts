import { Predicate } from 'effect'

import { asEffectsTool, type EffectsTool } from '@looms/agent'
import { invoke, typeIds, type JsonValue, type LoomsIds, type SchemaInput } from '@looms/core'

import { readActivation } from './definitions'
import {
  ChangeTaskArgsSchema,
  ClaimTaskArgsSchema,
  CreateTaskArgsSchema,
  LabelArgsSchema,
  ListTasksArgsSchema,
  PostArgsSchema,
  ReadArgsSchema,
  RenewTaskArgsSchema,
  ReplyArgsSchema,
  SettleTaskArgsSchema,
  ViewArgsSchema,
  cancelTaskEffect,
  claimTaskEffect,
  createTaskEffect,
  labelEffect,
  listTasksEffect,
  postEffect,
  readEffect,
  renewTaskEffect,
  reopenTaskEffect,
  replyEffect,
  settleTaskEffect,
  viewEffect,
} from './effects'
import type { BoardBinding } from './steps'

/**
 * A tool whose call becomes one board effect. The agent waits for the event that carries the
 * same `callId`: the board's answer, or `swarm.call.rejected` when the board refused.
 */
function boardTool(
  binding: BoardBinding,
  def: {
    readonly name: string
    readonly description: string
    readonly input: SchemaInput
    readonly effect: { readonly type: string }
    readonly answer: string
  },
  ids: LoomsIds,
): EffectsTool {
  const callId = ids.create('wait')

  return asEffectsTool({
    name: def.name,
    description: def.description,
    input: def.input,
    effects: (args: JsonValue) => {
      const fields = Predicate.isObject(args) ? args : {}

      return [invoke(def.effect.type, { ...fields, callId, board: binding.board, as: binding.as })]
    },
    waitOn: { type: [def.answer, 'swarm.call.rejected'], match: { callId } },
  })
}

/**
 * The board as agent tools, writing as `binding.as` on `binding.board`. Build a fresh set for
 * each turn (`resolveTools` does), because every tool carries the id of the one call it serves.
 */
export function boardTools(binding: BoardBinding, ids: LoomsIds = typeIds): EffectsTool[] {
  return [
    boardTool(
      binding,
      {
        name: 'board_read',
        description:
          'Read messages from the board, oldest first. Pass `thread` with a message id to read a whole thread, `channel` to read a channel ("support") or a subtree ("support/"), or `mentionsMe` for messages that mention you. Without `after` you get the latest `limit` matches. A message lists its files under `attachments`. To look at them, call board_view.',
        input: ReadArgsSchema,
        effect: readEffect,
        answer: 'swarm.messages.read',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_view',
        description:
          'Look at the files attached to one message or task, such as a screenshot or a recording. The files are shown to you with the result.',
        input: ViewArgsSchema,
        effect: viewEffect,
        answer: 'swarm.attachments.viewed',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_post',
        description:
          'Start a new thread in a channel. Mention a member with @name to wake them. To continue an existing thread, use board_reply. Pass `attachments` to share files: each is a reference `{ id, mediaType, name }` copied from a message or from the tool that produced the file.',
        input: PostArgsSchema,
        effect: postEffect,
        answer: 'swarm.message.posted',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_reply',
        description:
          'Reply in the thread of message `to`. Use it to answer, report progress on a task, or mention a member with @name. Pass `attachments` to share files.',
        input: ReplyArgsSchema,
        effect: replyEffect,
        answer: 'swarm.message.posted',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_label',
        description:
          'Set or unset key=value labels on a message to track state. Pass `if` to change them only when the labels still have the values you expect (null means unset).',
        input: LabelArgsSchema,
        effect: labelEffect,
        answer: 'swarm.message.labeled',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_create_task',
        description:
          'Put a unit of work on the board for a member to claim. Pass `for` to assign it to one member, and `needs` with task ids that must complete first. The text is the instructions for whoever claims it. Pass `attachments` for files the work needs.',
        input: CreateTaskArgsSchema,
        effect: createTaskEffect,
        answer: 'swarm.task.created',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_list_tasks',
        description: 'List tasks, oldest first, filtered by channel, state, or assignee.',
        input: ListTasksArgsSchema,
        effect: listTasksEffect,
        answer: 'swarm.tasks.listed',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_claim_task',
        description:
          'Claim a task before working on it, so no other member does the same work. Pass `task` to claim one task, or `channel` to take the oldest ready task you may work on. The result has a `token`: keep it for board_settle_task. The claim lasts until `until`; if the work will take longer, call board_renew_task before then or the task returns to the queue. `claim` is null when nothing is ready.',
        input: ClaimTaskArgsSchema,
        effect: claimTaskEffect,
        answer: 'swarm.task.claimed',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_settle_task',
        description:
          'Finish a task you claimed, using the token from board_claim_task. Outcome "completed" with the result in `note`, "failed" with the reason, "blocked" with what it is waiting on, or "released" to return it to the queue untouched.',
        input: SettleTaskArgsSchema,
        effect: settleTaskEffect,
        answer: 'swarm.task.settled',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_renew_task',
        description:
          "Extend your claim on a task you are still working on, using the token from board_claim_task. Call it before the claim's `until` passes. It fails with claim_lost when the claim already ended.",
        input: RenewTaskArgsSchema,
        effect: renewTaskEffect,
        answer: 'swarm.task.renewed',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_reopen_task',
        description:
          'Return a blocked, failed or canceled task to the queue so it can be claimed again, with the reason in `note`. Use it when what blocked the task is resolved.',
        input: ChangeTaskArgsSchema,
        effect: reopenTaskEffect,
        answer: 'swarm.task.reopened',
      },
      ids,
    ),
    boardTool(
      binding,
      {
        name: 'board_cancel_task',
        description:
          'Cancel a task that should no longer be done, with the reason in `note`. A claim on it ends. Tasks that need it stay waiting.',
        input: ChangeTaskArgsSchema,
        effect: cancelTaskEffect,
        answer: 'swarm.task.canceled',
      },
      ids,
    ),
  ]
}

/**
 * The board tools of the swarm member a run was started for, or none when the run was not
 * started by a swarm. Pass it as an agent's `resolveTools`:
 *
 * ```ts
 * const triage = defineAgent({ name: 'triage', instructions, resolveTools: memberTools })
 * ```
 */
export function memberTools(ctx: {
  readonly input: JsonValue
  readonly ids?: LoomsIds
}): EffectsTool[] {
  const activation = readActivation(ctx.input)

  return activation
    ? boardTools({ board: activation.swarm.board, as: activation.swarm.member }, ctx.ids)
    : []
}
