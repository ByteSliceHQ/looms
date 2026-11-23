import type { Schema } from 'effect'

import { createWaitId, invoke, wait, type RuntimeEffect } from '@looms/core'

import {
  createTaskEffect,
  postEffect,
  type CreateTaskArgsSchema,
  type PostArgsSchema,
} from './effects'

/** Which board a step writes to and the name it writes under. */
export interface BoardBinding {
  readonly board: string
  readonly as: string
}

/**
 * Post to a board from a thread or workflow node, and park until the board has answered.
 * The node resumes with the posted message, or fails if the board refused the post.
 */
export function post(
  binding: BoardBinding,
  args: Schema.Schema.Type<typeof PostArgsSchema>,
): RuntimeEffect[] {
  const callId = createWaitId('swarm')

  return [
    invoke(postEffect, { callId, ...binding, ...args }, `post_${callId}`),
    wait({
      waitId: callId,
      on: { type: ['swarm.message.posted', 'swarm.call.rejected'], match: { callId } },
    }),
  ]
}

/** Create a board task from a thread or workflow node, and park until the board has answered. */
export function createTask(
  binding: BoardBinding,
  args: Schema.Schema.Type<typeof CreateTaskArgsSchema>,
): RuntimeEffect[] {
  const callId = createWaitId('swarm')

  return [
    invoke(createTaskEffect, { callId, ...binding, ...args }, `task_${callId}`),
    wait({
      waitId: callId,
      on: { type: ['swarm.task.created', 'swarm.call.rejected'], match: { callId } },
    }),
  ]
}
