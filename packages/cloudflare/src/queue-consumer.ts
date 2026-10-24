import { Data, Effect } from 'effect'

import {
  resolveJson,
  type BlobStore,
  type EventInput,
  type JsonValue,
  type SecretContext,
  type WorkerCallback,
  type WorkerCallbackInput,
  type WorkerCallbackResult,
  type WorkerSecretsResult,
} from '@looms/core'

import {
  readQueueEffectMessage,
  type QueueEffectMessage,
  type QueueMessageLike,
} from './queue-message'

/** The worker half of the Looms HTTP API. `createLoomsClient({ baseUrl, workerCallbackToken })` is one. */
export interface WorkerCallbackClient {
  workerCallback(runId: string, input: WorkerCallbackInput): Promise<WorkerCallbackResult>
  workerSecrets(runId: string, attempt: WorkerCallback): Promise<WorkerSecretsResult>
}

/** The attempt a handler runs, with its input read back from the blob store when it was offloaded. */
export interface QueueTask extends Omit<QueueEffectMessage, 'v' | 'input' | 'inputRef'> {
  readonly input: JsonValue
}

export interface QueueTaskContext {
  /** Aborts once Looms asks the attempt to stop or no longer counts it as running. */
  readonly signal: AbortSignal
  /** Report progress. A later attempt receives the last `details` as `task.details`. */
  heartbeat(details?: JsonValue): Promise<void>
  /** The run's secret context. Rejects once the attempt is no longer running. */
  secrets(): Promise<SecretContext>
}

export type QueueTaskHandler = (
  task: QueueTask,
  ctx: QueueTaskContext,
) => Promise<ReadonlyArray<EventInput>> | ReadonlyArray<EventInput>

/** Throw from a handler to control how Looms treats the failed attempt. */
export class QueueTaskError extends Data.TaggedError('QueueTaskError')<{
  readonly message: string
  /** Fail the effect even when the retry policy has attempts left. */
  readonly nonRetryable?: boolean
  /** Wait at least this long before the next attempt. */
  readonly retryAfterMs?: number
}> {}

export interface QueueConsumerOptions {
  readonly handlers: Readonly<Record<string, QueueTaskHandler>>
  readonly callbacks: WorkerCallbackClient
  /** Reads inputs the producer offloaded. Use the store the producer writes to. */
  readonly blobs?: BlobStore
}

export interface QueueBatchLike {
  readonly messages: ReadonlyArray<QueueMessageLike>
}

class CallbackError extends Data.TaggedError('CallbackError')<{ readonly message: string }> {}

/**
 * Run one delivery. The message is acked as soon as Looms accepts `started`, and Looms owns every
 * retry after that through heartbeat and start-to-close timeouts. A duplicate or stale delivery is
 * acked without running. A message that cannot be started yet is retried by the queue, and one that
 * never starts ends in the dead-letter queue, where the schedule-to-start timeout recovers it.
 */
export function processQueueMessage(
  message: QueueMessageLike,
  options: QueueConsumerOptions,
): Effect.Effect<void> {
  const task = readQueueEffectMessage(message)
  const handler = task && options.handlers[task.type]

  const redeliver = Effect.sync(() =>
    message.retry({ delaySeconds: redeliveryDelay(message.attempts) }),
  )

  if (!task || !handler) {
    return redeliver
  }

  const attempt: WorkerCallback = { effectId: task.effectId, attempt: task.attempt }

  return callback(() =>
    options.callbacks.workerCallback(task.runId, { ...attempt, kind: 'started' }),
  ).pipe(
    Effect.matchEffect({
      onFailure: () => redeliver,
      onSuccess: (started) =>
        Effect.sync(() => message.ack()).pipe(
          Effect.andThen(
            started.status === 'accepted'
              ? runAttempt(task, attempt, handler, started.cancelRequested, options)
              : Effect.void,
          ),
        ),
    }),
  )
}

/** A push consumer: call it from the Worker's `queue(batch)` handler. */
export function queueConsumer(
  options: QueueConsumerOptions,
): (batch: QueueBatchLike) => Promise<void> {
  return (batch) =>
    Effect.runPromise(
      Effect.forEach(batch.messages, (message) => processQueueMessage(message, options), {
        concurrency: 'unbounded',
        discard: true,
      }),
    )
}

function runAttempt(
  task: QueueEffectMessage,
  attempt: WorkerCallback,
  handler: QueueTaskHandler,
  cancelRequested: boolean,
  options: QueueConsumerOptions,
): Effect.Effect<void> {
  const controller = new AbortController()

  if (cancelRequested) {
    controller.abort()
  }

  const report = (input: WorkerCallbackInput) =>
    callback(() => options.callbacks.workerCallback(task.runId, input)).pipe(Effect.ignore)

  const ctx: QueueTaskContext = {
    signal: controller.signal,
    heartbeat: (details) =>
      Effect.runPromise(
        callback(() =>
          options.callbacks.workerCallback(
            task.runId,
            details === undefined
              ? { ...attempt, kind: 'heartbeat' }
              : { ...attempt, kind: 'heartbeat', details },
          ),
        ).pipe(
          Effect.map((result) => {
            if (result.status !== 'accepted' || result.cancelRequested) {
              controller.abort()
            }
          }),
        ),
      ),
    secrets: () =>
      Effect.runPromise(
        callback(() => options.callbacks.workerSecrets(task.runId, attempt)).pipe(
          Effect.flatMap((result) => {
            if (result.status === 'accepted') {
              return Effect.succeed(result.secrets)
            }

            controller.abort()

            return Effect.fail(new CallbackError({ message: `the attempt is ${result.status}` }))
          }),
        ),
      ),
  }

  return taskInput(task, options.blobs).pipe(
    Effect.flatMap((input) =>
      Effect.tryPromise({
        try: () => Promise.resolve(handler({ ...taskFields(task), input }, ctx)),
        catch: (cause) =>
          cause instanceof QueueTaskError
            ? cause
            : new QueueTaskError({
                message: cause instanceof Error ? cause.message : String(cause),
              }),
      }),
    ),
    Effect.matchEffect({
      onSuccess: (events) => report({ ...attempt, kind: 'complete', events }),
      onFailure: (error) =>
        report(
          controller.signal.aborted
            ? { ...attempt, kind: 'cancelled' }
            : {
                ...attempt,
                kind: 'fail',
                error: error.message,
                nonRetryable: error.nonRetryable,
                retryAfterMs: error.retryAfterMs,
              },
        ),
    }),
  )
}

function taskFields(task: QueueEffectMessage): Omit<QueueTask, 'input'> {
  const { v: _v, input: _input, inputRef: _inputRef, ...fields } = task

  return fields
}

function taskInput(
  task: QueueEffectMessage,
  blobs: BlobStore | undefined,
): Effect.Effect<JsonValue, QueueTaskError> {
  if (!task.inputRef) {
    return Effect.succeed(task.input ?? null)
  }

  if (!blobs) {
    return Effect.fail(
      new QueueTaskError({ message: 'the input was offloaded and the consumer has no blob store' }),
    )
  }

  return resolveJson(task.inputRef, blobs).pipe(
    Effect.mapError(
      (error) => new QueueTaskError({ message: `could not read the input: ${error.message}` }),
    ),
  )
}

function callback<A>(call: () => Promise<A>): Effect.Effect<A, CallbackError> {
  return Effect.tryPromise({
    try: call,
    catch: (cause) =>
      new CallbackError({ message: cause instanceof Error ? cause.message : String(cause) }),
  })
}

/** Seconds before the queue redelivers a message that could not start: 1, 2, 4, ... up to 60. */
function redeliveryDelay(attempts: number): number {
  return Math.min(60, 2 ** Math.max(0, attempts - 1))
}
