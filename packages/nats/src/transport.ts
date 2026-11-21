import { JetStreamApiCodes, JetStreamApiError, jetstreamManager } from '@nats-io/jetstream'
import type { JetStreamManager, StreamConfig } from '@nats-io/jetstream'
import { headers, nuid } from '@nats-io/nats-core'
import type { NatsConnection } from '@nats-io/nats-core'
import { Data, Effect, Schema } from 'effect'

/** The server refuses atomic batches over 1000 messages. */
export const SERVER_BATCH_LIMIT = 1000

/** JetStream `err_code` for a failed `Nats-Expected-Last-Subject-Sequence` check. */
export const WRONG_LAST_SEQUENCE = 10071

export class NatsProjectorError extends Data.TaggedError('NatsProjectorError')<{
  readonly message: string
  readonly cause?: unknown
  /** JetStream `err_code` when the server rejected the request. */
  readonly errCode?: number
}> {}

/** A message the projector wants stored. `payload` is the JSON envelope as text. */
export interface NatsOutgoingMessage {
  readonly subject: string
  readonly payload: string
  readonly headers: { readonly [name: string]: string }
  /**
   * True when storing this message drops every earlier message on its subject, so the subject
   * only ever holds the newest. The stream has to allow it (`allow_rollup_hdrs` on NATS).
   */
  readonly replaces?: boolean
}

/** A message the stream holds. */
export interface NatsStoredMessage {
  readonly subject: string
  /** The message's sequence in the stream. */
  readonly streamSeq: number
  readonly headers: { readonly [name: string]: string }
}

/** One run's events, to be stored whole or not at all. */
export interface NatsCommit {
  /** Matches every subject of the run and no other run's. */
  readonly filter: string
  /**
   * Stream sequence of the last message on `filter`, 0 when it has none. A stream whose last
   * message on `filter` is any other must refuse the commit with `WRONG_LAST_SEQUENCE`.
   */
  readonly expected: number
  /** In log order, never more than the transport's `maxBatch`, never empty. */
  readonly messages: readonly NatsOutgoingMessage[]
}

/**
 * How the projector reaches a stream. `natsConnectionTransport` speaks to NATS over a
 * connection. A host that can't hold one, such as a Durable Object behind an HTTP bridge,
 * supplies its own: the two operations are all the projector asks of a stream.
 */
export interface NatsProjectorTransport {
  /** The most messages one `commit` takes. At most 1000, which is also the default. */
  readonly maxBatch?: number
  /** One-time setup. Runs before the first `last` or `commit`, and again after it fails. */
  readonly init?: () => Effect.Effect<void, NatsProjectorError>
  /** The last message on `filter`, or `null` when the stream holds none. */
  readonly last: (filter: string) => Effect.Effect<NatsStoredMessage | null, NatsProjectorError>
  /** Stores the batch atomically and returns the stream sequence of its last message. */
  readonly commit: (batch: NatsCommit) => Effect.Effect<number, NatsProjectorError>
  readonly dispose?: () => Effect.Effect<void>
}

/**
 * Where the transport gets its connection. Use whichever NATS client fits the runtime:
 * `@nats-io/transport-node`, `wsconnect`, and so on.
 */
export type NatsConnectionSource =
  | {
      /** A connection the caller owns. The transport never closes it. */
      readonly connection: NatsConnection
      readonly connect?: never
    }
  | {
      /**
       * Opens a connection the transport owns: called on first use, called again after the
       * connection closes, and drained on `dispose`.
       */
      readonly connect: () => PromiseLike<NatsConnection>
      readonly connection?: never
    }

export interface NatsStreamSettings {
  /** JetStream stream name. Defaults to `LOOMS`. */
  readonly stream?: string
  /**
   * Stream config used when `init` finds no stream. `name`, `subjects` and `allow_atomic` are
   * always set by the transport. Pass `false` when the stream is managed elsewhere.
   */
  readonly createStream?: Partial<StreamConfig> | false
  /** Milliseconds to wait for a batch commit. Defaults to 5000. */
  readonly timeoutMs?: number
}

export type NatsConnectionTransportOptions = NatsConnectionSource &
  NatsStreamSettings & {
    /** The subjects a stream made by `init` takes. */
    readonly subjects: readonly string[]
    /**
     * True when messages will be sent that replace the earlier ones on their subject. `init`
     * then makes the stream with `allow_rollup_hdrs`, and refuses an existing one without it.
     */
    readonly replaces?: boolean
  }

const CommitResponse = Schema.Union([
  Schema.Struct({
    error: Schema.Struct({
      code: Schema.Finite,
      err_code: Schema.optional(Schema.Finite),
      description: Schema.String,
    }),
  }),
  Schema.Struct({
    stream: Schema.String,
    seq: Schema.Finite,
  }),
])

const decodeCommitResponse = Schema.decodeUnknownEffect(Schema.fromJsonString(CommitResponse))
const encoder = new TextEncoder()

function natsFailure(message: string) {
  return (cause: unknown) =>
    new NatsProjectorError({
      message: `${message}: ${cause instanceof Error ? cause.message : String(cause)}`,
      cause,
      errCode: cause instanceof JetStreamApiError ? cause.code : undefined,
    })
}

function attempt<A>(message: string, operation: () => PromiseLike<A>) {
  return Effect.tryPromise({ try: () => Promise.resolve(operation()), catch: natsFailure(message) })
}

function wireMessage(
  message: NatsOutgoingMessage,
  batch: {
    readonly batchId: string
    readonly position: number
    /** Set on the first message: the sequence the run's last message must have. */
    readonly expected: { readonly filter: string; readonly sequence: number } | undefined
    readonly commit: boolean
  },
) {
  const header = headers()
  header.set('Nats-Batch-Id', batch.batchId)
  header.set('Nats-Batch-Sequence', String(batch.position))

  // No Nats-Msg-Id: the run-sequence expectation already refuses duplicates, and message ids
  // outlive a purge inside the dedup window, which would block refilling a reset stream.
  for (const [name, value] of Object.entries(message.headers)) {
    header.set(name, value)
  }

  if (batch.expected) {
    header.set('Nats-Expected-Last-Subject-Sequence', String(batch.expected.sequence))
    header.set('Nats-Expected-Last-Subject-Sequence-Subject', batch.expected.filter)
  }

  if (message.replaces) {
    header.set('Nats-Rollup', 'sub')
  }

  if (batch.commit) {
    header.set('Nats-Batch-Commit', '1')
  }

  return { subject: message.subject, payload: encoder.encode(message.payload), headers: header }
}

/**
 * The transport over a NATS connection. A commit is a JetStream atomic batch whose first
 * message expects the run's last stream sequence, so the server refuses a concurrent writer.
 *
 * Requires nats-server 2.12 or newer (atomic batch publish).
 */
export function natsConnectionTransport(
  options: NatsConnectionTransportOptions,
): NatsProjectorTransport {
  const stream = options.stream ?? 'LOOMS'
  const timeout = options.timeoutMs ?? 5_000
  const open = options.connect
  const borrowed = options.connection
  let opened: Promise<NatsConnection> | undefined
  let live: NatsConnection | undefined
  let manager: { readonly connection: NatsConnection; readonly jsm: JetStreamManager } | undefined

  const connection = Effect.suspend(() => {
    if (!open) {
      return borrowed
        ? Effect.succeed(borrowed)
        : Effect.fail(new NatsProjectorError({ message: 'Pass `connection` or `connect`' }))
    }

    return attempt('NATS connect failed', () => {
      if (live?.isClosed()) {
        live = undefined
        opened = undefined
      }

      opened ??= Promise.resolve(open()).then(
        (nc) => {
          live = nc
          return nc
        },
        (cause: unknown) => {
          opened = undefined
          throw cause
        },
      )

      return opened
    })
  })

  const jsm = connection.pipe(
    Effect.flatMap((nc) => {
      if (manager?.connection === nc) {
        return Effect.succeed(manager.jsm)
      }

      return attempt('JetStream unavailable', () => jetstreamManager(nc)).pipe(
        Effect.tap((created) =>
          Effect.sync(() => {
            manager = { connection: nc, jsm: created }
          }),
        ),
      )
    }),
  )

  const init = Effect.gen(function* () {
    const streams = (yield* jsm).streams

    const info = yield* attempt(`Reading stream ${stream} failed`, () => streams.info(stream)).pipe(
      Effect.catchIf(
        (error) => error.errCode === JetStreamApiCodes.StreamNotFound,
        () => Effect.succeed(null),
      ),
    )

    if (info && info.config.allow_atomic !== true) {
      return yield* new NatsProjectorError({
        message: `Stream ${stream} must set allow_atomic: true for the Looms NATS projector`,
      })
    }

    if (info && options.replaces === true && !info.config.allow_rollup_hdrs) {
      return yield* new NatsProjectorError({
        message: `Stream ${stream} must set allow_rollup_hdrs: true to leave ephemeral events out`,
      })
    }

    if (info) {
      return info
    }

    if (options.createStream === false) {
      return yield* new NatsProjectorError({ message: `Stream ${stream} does not exist` })
    }

    return yield* attempt(`Creating stream ${stream} failed`, () =>
      streams.add({
        ...options.createStream,
        name: stream,
        subjects: [...options.subjects],
        allow_atomic: true,
        ...(options.replaces === true ? { allow_rollup_hdrs: true } : undefined),
      }),
    )
  })

  const last = (filter: string) =>
    Effect.gen(function* () {
      const streams = (yield* jsm).streams

      const message = yield* attempt(`Reading the last message on ${filter} failed`, () =>
        streams.getMessage(stream, { last_by_subj: filter }),
      )

      if (!message) {
        return null
      }

      const stored: { [name: string]: string } = {}

      for (const name of message.header.keys()) {
        stored[name] = message.header.get(name)
      }

      return {
        subject: message.subject,
        streamSeq: message.seq,
        headers: stored,
      } satisfies NatsStoredMessage
    })

  const commit = (batch: NatsCommit) =>
    Effect.gen(function* () {
      const nc = yield* connection
      const batchId = nuid.next()

      const final = yield* Effect.try({
        try: () => {
          const messages = batch.messages.map((message, index) =>
            wireMessage(message, {
              batchId,
              position: index + 1,
              expected:
                index === 0 ? { filter: batch.filter, sequence: batch.expected } : undefined,
              commit: index === batch.messages.length - 1,
            }),
          )

          for (const message of messages.slice(0, -1)) {
            nc.publish(message.subject, message.payload, { headers: message.headers })
          }

          return messages.at(-1)
        },
        catch: natsFailure(`Publishing on ${batch.filter} failed`),
      })

      if (!final) {
        return batch.expected
      }

      const reply = yield* attempt(`Committing the batch on ${batch.filter} failed`, () =>
        nc.request(final.subject, final.payload, { headers: final.headers, timeout }),
      )

      const response = yield* decodeCommitResponse(reply.string()).pipe(
        Effect.mapError(natsFailure(`Unreadable commit reply on ${batch.filter}`)),
      )

      if ('error' in response) {
        const errCode = response.error.err_code
        const conflict = errCode === WRONG_LAST_SEQUENCE

        return yield* new NatsProjectorError({
          message: conflict
            ? `Another writer published on ${batch.filter} first (${response.error.description})`
            : `JetStream refused the batch on ${batch.filter}: ${response.error.description}`,
          errCode,
        })
      }

      return response.seq
    })

  const dispose = Effect.promise(() => {
    const owned = opened
    opened = undefined
    live = undefined
    manager = undefined

    if (!owned) {
      return Promise.resolve()
    }

    return owned.then(
      (nc) => (nc.isClosed() ? undefined : nc.drain()),
      () => undefined,
    )
  })

  return {
    maxBatch: SERVER_BATCH_LIMIT,
    init: () => Effect.asVoid(init),
    last,
    commit,
    dispose: () => dispose,
  }
}
