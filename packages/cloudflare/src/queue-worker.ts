import { Data, Effect, type Types } from 'effect'

import { claimJson, utf8JsonBytes, type BlobStore, type WorkerEffectDefinition } from '@looms/core'
import type { EffectWorker, EffectWorkerTask } from '@looms/runtime'

import type { QueueEffectMessage } from './queue-message'

/** Leaves room under Cloudflare's 128 KB message limit. */
export const DEFAULT_MAX_QUEUE_MESSAGE_BYTES = 100_000

/** A Cloudflare Queue producer binding, or anything that sends the same way. */
export interface QueueProducer {
  send(message: QueueEffectMessage, options?: { readonly contentType?: 'json' }): Promise<void>
}

/**
 * Route worker-placed effect definitions to a queue. Passing a local-placed definition is a
 * type error — only {@link WorkerEffectDefinition} values are accepted.
 */
export interface QueueRoute {
  /**
   * Worker effects this queue accepts. Inputs differ per effect; dispatch reads `type`.
   * `any` keeps a specific effect assignable. A local effect still is not.
   */
  readonly effects: ReadonlyArray<WorkerEffectDefinition<any>>
  readonly queue: QueueProducer
}

export interface CloudflareQueueWorkerOptions {
  /** The first route that lists an effect type gets its attempts. */
  readonly routes: ReadonlyArray<QueueRoute>
  /** Holds an input that would push a message past `maxMessageBytes`. Without it, that dispatch fails. */
  readonly blobs?: BlobStore
  readonly maxMessageBytes?: number
}

export class QueueDispatchError extends Data.TaggedError('QueueDispatchError')<{
  readonly message: string
}> {}

/**
 * An {@link EffectWorker} that sends each attempt to a Cloudflare Queue. A send the queue rejects
 * (a 429, for one) fails the attempt under the effect's retry policy. A message the queue accepts
 * and later dead-letters is recovered by the effect's schedule-to-start timeout, which every routed
 * effect must set. Cancellation reaches a running attempt through its callback responses, since a
 * queued message cannot be recalled.
 */
export function cloudflareQueueWorker(options: CloudflareQueueWorkerOptions): EffectWorker {
  const routeFor = (type: string) =>
    options.routes.find((route) => route.effects.some((effect) => effect.type === type))

  return {
    dispatchSemantics: 'acknowledged',
    handles: (type) => routeFor(type) !== undefined,
    dispatch: (task) => Effect.runPromise(sendTask(task, routeFor(task.type), options)),
  }
}

function sendTask(
  task: EffectWorkerTask,
  route: QueueRoute | undefined,
  options: CloudflareQueueWorkerOptions,
): Effect.Effect<void, QueueDispatchError> {
  if (!route) {
    return Effect.fail(new QueueDispatchError({ message: `no queue route handles "${task.type}"` }))
  }

  return queueMessage(task, options).pipe(
    Effect.flatMap((message) =>
      Effect.tryPromise({
        try: () => route.queue.send(message, { contentType: 'json' }),
        catch: (cause) =>
          new QueueDispatchError({
            message: `queue send failed: ${cause instanceof Error ? cause.message : String(cause)}`,
          }),
      }),
    ),
  )
}

function queueMessage(
  task: EffectWorkerTask,
  options: CloudflareQueueWorkerOptions,
): Effect.Effect<QueueEffectMessage, QueueDispatchError> {
  const message: Types.Mutable<QueueEffectMessage> = {
    v: 1,
    runId: task.runId,
    effectId: task.effectId,
    attempt: task.attempt,
    type: task.type,
    threadId: task.threadId,
    causingEventId: task.causingEventId,
  }

  if (task.attributes !== undefined) {
    message.attributes = task.attributes
  }

  if (task.details !== undefined) {
    message.details = task.details
  }

  if (task.trace) {
    message.trace = task.trace
  }

  if (task.deadlines) {
    message.deadlines = task.deadlines
  }

  const inline: QueueEffectMessage = { ...message, input: task.input }
  const limit = options.maxMessageBytes ?? DEFAULT_MAX_QUEUE_MESSAGE_BYTES

  if (utf8JsonBytes(inline) <= limit) {
    return Effect.succeed(inline)
  }

  const { blobs } = options

  if (!blobs) {
    return Effect.fail(
      new QueueDispatchError({
        message: `the "${task.type}" message is over ${limit} bytes and no blob store is configured`,
      }),
    )
  }

  return claimJson(task.input, blobs).pipe(
    Effect.tap((ref) => blobs.retain(task.runId, [ref.sha256])),
    Effect.map((inputRef): QueueEffectMessage => ({ ...message, inputRef })),
    Effect.mapError(
      (error) => new QueueDispatchError({ message: `could not store the input: ${error.message}` }),
    ),
  )
}
