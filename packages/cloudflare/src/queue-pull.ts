import {
  Data,
  Deferred,
  Effect,
  Fiber,
  FiberSet,
  Option,
  Predicate,
  Schema,
  Semaphore,
} from 'effect'

import { stringifyJson, type JsonValue } from '@looms/core'

import { processQueueMessage, type QueueConsumerOptions } from './queue-consumer'
import type { QueueMessageLike } from './queue-message'

export interface PulledQueueMessage {
  readonly leaseId: string
  readonly body: unknown
  /** Deliveries so far, including this one. */
  readonly attempts: number
}

export interface QueuePullResult {
  readonly messages: ReadonlyArray<PulledQueueMessage>
  /** Messages waiting in the queue, when the source reports it. */
  readonly backlog?: number
}

export interface QueueLeaseRetry {
  readonly leaseId: string
  readonly delaySeconds: number
}

export class QueuePullError extends Data.TaggedError('QueuePullError')<{
  readonly message: string
  readonly status?: number
}> {}

/** Where a pull consumer leases messages from. `cloudflareQueuePullSource` reads a Cloudflare Queue. */
export interface QueuePullSource {
  readonly pull: (
    batchSize: number,
    visibilityTimeoutMs: number,
  ) => Effect.Effect<QueuePullResult, QueuePullError>
  readonly settle: (
    acks: ReadonlyArray<string>,
    retries: ReadonlyArray<QueueLeaseRetry>,
  ) => Effect.Effect<void, QueuePullError>
}

export interface QueuePullConsumerOptions extends QueueConsumerOptions {
  readonly source: QueuePullSource
  /** Attempts run at once. Default 8. */
  readonly concurrency?: number
  /** How long a leased message stays hidden. Acks land long before; default 30 s. */
  readonly visibilityTimeoutMs?: number
  /** The longest wait between pulls that come back empty or fail. Default 5 s. */
  readonly maxIdleMs?: number
  /** How often buffered acks and retries are sent. Default 250 ms. */
  readonly ackIntervalMs?: number
  /** A pull or ack request failed. The consumer backs off and keeps going. */
  readonly onError?: (error: QueuePullError) => void
}

export interface QueuePullConsumer {
  /** Messages waiting in the queue at the last pull, for autoscaling. */
  backlog(): number | undefined
  inFlight(): number
  /** Stop pulling, let running attempts finish, and send the last acks. Call it on SIGTERM. */
  stop(): Promise<void>
}

const MAX_PULL_BATCH = 100
const MIN_IDLE_MS = 50

/** Lease messages from `source` and run them with the same handlers as {@link queueConsumer}. */
export function createQueuePullConsumer(options: QueuePullConsumerOptions): QueuePullConsumer {
  const concurrency = Math.max(1, options.concurrency ?? 8)
  const visibilityTimeoutMs = options.visibilityTimeoutMs ?? 30_000
  const maxIdleMs = options.maxIdleMs ?? 5_000
  const slots = Semaphore.makeUnsafe(concurrency)
  const stopping = Deferred.makeUnsafe<void>()
  let backlog: number | undefined
  let inFlight = 0
  let acks: string[] = []
  let retries: QueueLeaseRetry[] = []

  const reportError = (error: QueuePullError) => Effect.sync(() => options.onError?.(error))

  const flush = Effect.suspend(() => {
    if (acks.length === 0 && retries.length === 0) {
      return Effect.void
    }

    const settled = options.source.settle(acks, retries)

    acks = []
    retries = []

    return settled.pipe(Effect.catchTag('QueuePullError', reportError))
  })

  const lease = (message: PulledQueueMessage): QueueMessageLike => ({
    body: message.body,
    attempts: message.attempts,
    ack: () => {
      acks.push(message.leaseId)
    },
    retry: (retry) => {
      retries.push({ leaseId: message.leaseId, delaySeconds: retry?.delaySeconds ?? 0 })
    },
  })

  const untilStopped = (effect: Effect.Effect<void>) =>
    Effect.raceFirst(effect, Deferred.await(stopping))

  const run = Effect.gen(function* () {
    const running = yield* FiberSet.make<void>()

    const flusher = yield* Effect.forkScoped(
      Effect.forever(Effect.sleep(options.ackIntervalMs ?? 250).pipe(Effect.andThen(flush))),
    )

    let idleMs = 0

    while (!(yield* Deferred.isDone(stopping))) {
      yield* untilStopped(Semaphore.withPermits(slots, 1)(Effect.void))

      if (yield* Deferred.isDone(stopping)) {
        break
      }

      const pulled = yield* options.source
        .pull(Math.min(concurrency - inFlight, MAX_PULL_BATCH), visibilityTimeoutMs)
        .pipe(
          Effect.catchTag('QueuePullError', (error) =>
            reportError(error).pipe(Effect.as<QueuePullResult>({ messages: [] })),
          ),
        )

      backlog = pulled.backlog ?? backlog

      for (const message of pulled.messages) {
        inFlight += 1

        yield* FiberSet.run(
          running,
          Semaphore.withPermits(
            slots,
            1,
          )(processQueueMessage(lease(message), options)).pipe(
            Effect.ensuring(
              Effect.sync(() => {
                inFlight -= 1
              }),
            ),
          ),
        )
      }

      idleMs =
        pulled.messages.length > 0 ? 0 : Math.min(maxIdleMs, Math.max(MIN_IDLE_MS, idleMs * 2))

      if (idleMs > 0) {
        yield* untilStopped(Effect.sleep(idleMs))
      }
    }

    yield* FiberSet.awaitEmpty(running)
    yield* Fiber.interrupt(flusher)
    yield* flush
  })

  const fiber = Effect.runFork(Effect.scoped(run))

  return {
    backlog: () => backlog,
    inFlight: () => inFlight,
    stop: () =>
      Effect.runPromise(
        Deferred.succeed(stopping, undefined).pipe(Effect.andThen(Fiber.join(fiber))),
      ),
  }
}

export interface CloudflareQueuePullSourceOptions {
  readonly accountId: string
  readonly queueId: string
  /** An API token with Queues edit permission. */
  readonly token: string
  readonly fetch?: typeof fetch
}

const PullResponseSchema = Schema.Struct({
  result: Schema.Struct({
    message_backlog_count: Schema.optional(Schema.Finite),
    messages: Schema.Array(
      Schema.Struct({
        lease_id: Schema.String,
        attempts: Schema.Finite,
        body: Schema.Json,
      }),
    ),
  }),
})

const decodePullResponse = Schema.decodeUnknownEffect(PullResponseSchema)
const decodeJsonText = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Json))

/** The Cloudflare Queues HTTP pull API. The producer must send `contentType: 'json'`. */
export function cloudflareQueuePullSource(
  options: CloudflareQueuePullSourceOptions,
): QueuePullSource {
  const fetchImpl = options.fetch ?? fetch

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(options.accountId)}/queues/${encodeURIComponent(options.queueId)}/messages`

  const post = (path: string, body: JsonValue) =>
    Effect.tryPromise({
      try: () =>
        fetchImpl(`${endpoint}/${path}`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.token}`,
            'content-type': 'application/json',
          },
          body: stringifyJson(body),
        }),
      catch: (cause) =>
        new QueuePullError({ message: cause instanceof Error ? cause.message : String(cause) }),
    }).pipe(
      Effect.filterOrFail(
        (response) => response.ok,
        (response) =>
          new QueuePullError({
            message: `Cloudflare Queues ${path} returned ${response.status}`,
            status: response.status,
          }),
      ),
    )

  return {
    pull: (batchSize, visibilityTimeoutMs) =>
      post('pull', { batch_size: batchSize, visibility_timeout_ms: visibilityTimeoutMs }).pipe(
        Effect.flatMap((response) =>
          Effect.tryPromise({
            try: () => response.json(),
            catch: () => new QueuePullError({ message: 'the pull response is not JSON' }),
          }),
        ),
        Effect.flatMap((json) =>
          decodePullResponse(json).pipe(
            Effect.mapError(() => new QueuePullError({ message: 'unexpected pull response' })),
          ),
        ),
        Effect.map(({ result }) => ({
          backlog: result.message_backlog_count,
          messages: result.messages.map((message) => ({
            leaseId: message.lease_id,
            attempts: message.attempts,
            body: jsonBody(message.body),
          })),
        })),
      ),
    settle: (acks, retries) =>
      post('ack', {
        acks: acks.map((leaseId) => ({ lease_id: leaseId })),
        retries: retries.map((retry) => ({
          lease_id: retry.leaseId,
          delay_seconds: retry.delaySeconds,
        })),
      }).pipe(Effect.asVoid),
  }
}

/** The pull API returns a JSON message's body as its JSON text. */
function jsonBody(body: JsonValue): JsonValue {
  return Predicate.isString(body) ? Option.getOrElse(decodeJsonText(body), () => body) : body
}
