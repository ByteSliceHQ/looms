import { Data, Effect } from 'effect'

import {
  resolveJson,
  validateInput,
  type BlobStore,
  type EffectContext,
  type EffectDefinition,
  type EventInput,
  type JsonValue,
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

export type QueueTaskHandler = (
  task: QueueTask,
  ctx: EffectContext,
) => Promise<ReadonlyArray<EventInput>> | ReadonlyArray<EventInput>

type WorkerHandlerFn<TInput> = (
  input: TInput,
  ctx: EffectContext,
) => Promise<ReadonlyArray<EventInput>> | ReadonlyArray<EventInput>

type WorkerHandlerBinding<TInput> = readonly [EffectDefinition<TInput>, WorkerHandlerFn<TInput>]

/**
 * Build a `handlers` map from effect definitions. Input is validated with each definition's schema
 * before the typed handler runs, matching local `defineEffect` execute. Each entry keeps its own
 * `TInput` at the call site; the cast below is only at the validate boundary.
 */
export function workerHandlers<
  const Entries extends ReadonlyArray<WorkerHandlerBinding<any>>,
>(
  entries: {
    readonly [K in keyof Entries]: Entries[K] extends readonly [
      EffectDefinition<infer TInput>,
      unknown,
    ]
      ? WorkerHandlerBinding<TInput>
      : Entries[K]
  },
): Readonly<Record<string, QueueTaskHandler>> {
  const handlers: { [type: string]: QueueTaskHandler } = {}

  for (const [definition, handler] of entries) {
    handlers[definition.type] = async (task, ctx) => {
      if (definition.input) {
        const input = await validateInput(definition.input, task.input)
        // SAFETY: validateInput returns InferSchemaOutput for the definition's schema; TInput is that type.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        return handler(input as never, ctx)
      }

      // SAFETY: definitions without an input schema take JsonValue, matching EffectDefinition's default TInput.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return handler(task.input as never, ctx)
    }
  }

  return handlers
}

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

  const report = (input: WorkerCallbackInput): Effect.Effect<void> => {
    const send = (remaining: number): Effect.Effect<void> =>
      callback(() => options.callbacks.workerCallback(task.runId, input)).pipe(
        Effect.asVoid,
        Effect.catch(() =>
          remaining <= 0
            ? Effect.logWarning(
                `[@looms/cloudflare] lost terminal worker callback for ${task.runId} ${attempt.effectId} attempt ${attempt.attempt}`,
              ).pipe(Effect.asVoid)
            : Effect.sleep(50 * (5 - remaining)).pipe(Effect.andThen(send(remaining - 1))),
        ),
      )

    return send(4)
  }

  const emitted: EventInput[] = []

  const loadSecrets = () =>
    callback(() => options.callbacks.workerSecrets(task.runId, attempt)).pipe(
      Effect.flatMap((result) => {
        if (result.status === 'accepted') {
          return Effect.succeed(result.secrets)
        }

        controller.abort()

        return Effect.fail(new CallbackError({ message: `the attempt is ${result.status}` }))
      }),
    )

  return taskInput(task, options.blobs).pipe(
    Effect.flatMap((input) =>
      loadSecrets().pipe(
        Effect.mapError(
          (error) => new QueueTaskError({ message: error.message, nonRetryable: true }),
        ),
        Effect.flatMap((secrets) => {
          const ctx: EffectContext = {
            effectId: task.effectId,
            runId: task.runId,
            threadId: task.threadId,
            causingEventId: task.causingEventId,
            signal: controller.signal,
            attributes: task.attributes ?? {},
            secrets,
            trace: task.trace ?? null,
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
            emit: async (event) => {
              emitted.push(event)
            },
          }

          return Effect.tryPromise({
            try: () => Promise.resolve(handler({ ...taskFields(task), input }, ctx)),
            catch: (cause) =>
              cause instanceof QueueTaskError
                ? cause
                : new QueueTaskError({
                    message: cause instanceof Error ? cause.message : String(cause),
                  }),
          })
        }),
      ),
    ),
    Effect.matchEffect({
      onSuccess: (events) =>
        report({ ...attempt, kind: 'complete', events: [...emitted, ...events] }),
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
