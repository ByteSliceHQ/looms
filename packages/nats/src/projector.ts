import { JetStreamApiCodes, JetStreamApiError, jetstreamManager } from '@nats-io/jetstream'
import type { JetStreamManager, StreamConfig } from '@nats-io/jetstream'
import { headers, nuid } from '@nats-io/nats-core'
import type { NatsConnection } from '@nats-io/nats-core'
import { Data, Effect, Schema } from 'effect'

import { encodeLoomsEvent, type EventEnvelope } from '@looms/core'
import { ReplicaGapError, type Projector } from '@looms/projectors'

import { eventSubject, isValidSubjectPrefix, runSubjectFilter, streamSubject } from './subjects'

/** Headers on every message, so consumers can route without decoding the body. */
export const LoomsHeaders = {
  runId: 'Looms-Run-Id',
  seq: 'Looms-Seq',
  eventId: 'Looms-Event-Id',
  type: 'Looms-Type',
  threadId: 'Looms-Thread-Id',
  ephemeral: 'Looms-Ephemeral',
} as const

/** The server refuses atomic batches over 1000 messages. */
const SERVER_BATCH_LIMIT = 1000

/** JetStream `err_code` for a failed `Nats-Expected-Last-Subject-Sequence` check. */
const WRONG_LAST_SEQUENCE = 10071

export class NatsProjectorError extends Data.TaggedError('NatsProjectorError')<{
  readonly message: string
  readonly cause?: unknown
  /** JetStream `err_code` when the server rejected the request. */
  readonly errCode?: number
}> {}

/**
 * Where the projector gets its connection. Use whichever transport fits the runtime:
 * `@nats-io/transport-node`, `wsconnect`, and so on.
 */
export type NatsConnectionSource =
  | {
      /** A connection the caller owns. The projector never closes it. */
      readonly connection: NatsConnection
      readonly connect?: never
    }
  | {
      /**
       * Opens a connection the projector owns: called on first use, called again after the
       * connection closes, and drained on `dispose`.
       */
      readonly connect: () => PromiseLike<NatsConnection>
      readonly connection?: never
    }

export type NatsProjectorOptions = NatsConnectionSource & NatsProjectorSettings

export interface NatsProjectorSettings {
  /** JetStream stream name. Defaults to `LOOMS`. */
  readonly stream?: string
  /** Subject prefix; events go to `<prefix>.run.<runId>.<type>`. Defaults to `looms`. */
  readonly subjectPrefix?: string
  /**
   * Stream config used when `init` finds no stream. `name`, `subjects` and `allow_atomic` are
   * always set by the projector. Pass `false` when the stream is managed elsewhere.
   */
  readonly createStream?: Partial<StreamConfig> | false
  /** Events per atomic batch (at most 1000). Defaults to 1000. */
  readonly maxBatch?: number
  /** Milliseconds to wait for a batch commit. Defaults to 5000. */
  readonly timeoutMs?: number
  /** Projector name for delivery cursors and diagnostics. Defaults to `nats`. */
  readonly name?: string
}

interface RunTail {
  /** Last Looms seq published for the run, 0 when none. */
  readonly loomsSeq: number
  /** Stream sequence of that message, 0 when none. The next batch must expect exactly this. */
  readonly streamSeq: number
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

function groupByRun(events: ReadonlyArray<EventEnvelope>): Map<string, EventEnvelope[]> {
  const groups = new Map<string, EventEnvelope[]>()

  for (const event of events) {
    const batch = groups.get(event.runId) ?? []
    batch.push(event)
    groups.set(event.runId, batch)
  }

  return groups
}

function chunk<A>(items: readonly A[], size: number): A[][] {
  const chunks: A[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

/** Events after `tail.loomsSeq`, refusing the batch if one is missing in front of them. */
function unpublished(runId: string, tail: RunTail, events: readonly EventEnvelope[]) {
  const pending: EventEnvelope[] = []
  let cursor = tail.loomsSeq

  for (const event of events) {
    if (event.seq <= cursor) {
      continue
    }

    if (event.seq !== cursor + 1) {
      return Effect.fail(
        new ReplicaGapError({ runId, replicatedSeq: tail.loomsSeq, batchFrom: event.seq }),
      )
    }

    pending.push(event)
    cursor = event.seq
  }

  return Effect.succeed(pending)
}

function batchMessage(
  prefix: string,
  runId: string,
  event: EventEnvelope,
  batch: {
    readonly batchId: string
    readonly position: number
    /** Stream sequence the first message expects for the run. */
    readonly expected: number | undefined
    readonly commit: boolean
  },
) {
  const header = headers()
  header.set('Nats-Batch-Id', batch.batchId)
  header.set('Nats-Batch-Sequence', String(batch.position))
  // No Nats-Msg-Id: the run-sequence expectation already refuses duplicates, and message ids
  // outlive a purge inside the dedup window, which would block refilling a reset stream.
  header.set(LoomsHeaders.runId, runId)
  header.set(LoomsHeaders.seq, String(event.seq))
  header.set(LoomsHeaders.eventId, event.id)
  header.set(LoomsHeaders.type, event.type)

  if (event.threadId) {
    header.set(LoomsHeaders.threadId, event.threadId)
  }

  if (event.ephemeral) {
    header.set(LoomsHeaders.ephemeral, 'true')
  }

  if (batch.expected !== undefined) {
    header.set('Nats-Expected-Last-Subject-Sequence', String(batch.expected))
    header.set('Nats-Expected-Last-Subject-Sequence-Subject', runSubjectFilter(prefix, runId))
  }

  if (batch.commit) {
    header.set('Nats-Batch-Commit', '1')
  }

  return {
    subject: eventSubject(prefix, runId, event.type),
    payload: encoder.encode(JSON.stringify(encodeLoomsEvent(event))),
    headers: header,
  }
}

/**
 * Replicates committed events to a NATS JetStream stream, one subject per event:
 * `<prefix>.run.<runId>.<type tokens>`. The body is the JSON envelope.
 *
 * Each batch is a JetStream atomic batch whose first message expects the run's last stream
 * sequence, so a batch lands whole or not at all, and a concurrent writer or a hole in the run
 * is refused by the server instead of reordering the copy. `position` reads the run's last
 * message, so durable delivery rewinds and catches up when the stream is behind its cursor.
 *
 * Requires nats-server 2.12 or newer (atomic batch publish).
 */
export function natsProjector(options: NatsProjectorOptions): Projector {
  const stream = options.stream ?? 'LOOMS'
  const prefix = options.subjectPrefix ?? 'looms'
  const maxBatch = Math.min(options.maxBatch ?? SERVER_BATCH_LIMIT, SERVER_BATCH_LIMIT)
  const timeout = options.timeoutMs ?? 5_000
  const name = options.name ?? 'nats'

  if (!isValidSubjectPrefix(prefix)) {
    throw new NatsProjectorError({
      message: `Subject prefix "${prefix}" must be dot-separated [A-Za-z0-9_-] tokens`,
    })
  }

  if (!Number.isInteger(maxBatch) || maxBatch < 1) {
    throw new NatsProjectorError({ message: 'maxBatch must be a positive integer' })
  }

  const open = options.connect
  const borrowed = options.connection
  let opened: Promise<NatsConnection> | undefined
  let live: NatsConnection | undefined
  let manager: { readonly connection: NatsConnection; readonly jsm: JetStreamManager } | undefined
  let ready: Promise<void> | undefined

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

  const ensureStream = Effect.gen(function* () {
    const streams = (yield* jsm).streams

    const info = yield* attempt(`Reading stream ${stream} failed`, () => streams.info(stream)).pipe(
      Effect.catchIf(
        (error) => error.errCode === JetStreamApiCodes.StreamNotFound,
        () => Effect.succeed(null),
      ),
    )

    if (info?.config.allow_atomic === true) {
      return info
    }

    if (info) {
      return yield* new NatsProjectorError({
        message: `Stream ${stream} must set allow_atomic: true for the Looms NATS projector`,
      })
    }

    if (options.createStream === false) {
      return yield* new NatsProjectorError({ message: `Stream ${stream} does not exist` })
    }

    return yield* attempt(`Creating stream ${stream} failed`, () =>
      streams.add({
        ...options.createStream,
        name: stream,
        subjects: [streamSubject(prefix)],
        allow_atomic: true,
      }),
    )
  })

  const init = (): Promise<void> => {
    ready ??= Effect.runPromise(Effect.asVoid(ensureStream)).catch((cause: unknown) => {
      ready = undefined
      throw cause
    })

    return ready
  }

  const readTail = (runId: string) =>
    Effect.gen(function* () {
      const streams = (yield* jsm).streams

      const last = yield* attempt(`Reading the last message of ${runId} failed`, () =>
        streams.getMessage(stream, { last_by_subj: runSubjectFilter(prefix, runId) }),
      )

      if (!last) {
        return { loomsSeq: 0, streamSeq: 0 } satisfies RunTail
      }

      const loomsSeq = Number(last.header?.get(LoomsHeaders.seq))

      if (!Number.isSafeInteger(loomsSeq) || loomsSeq < 1) {
        return yield* new NatsProjectorError({
          message: `Message ${last.seq} on ${last.subject} has no ${LoomsHeaders.seq} header`,
        })
      }

      return { loomsSeq, streamSeq: last.seq } satisfies RunTail
    })

  const publishBatch = (runId: string, batch: readonly EventEnvelope[], expected: number) =>
    Effect.gen(function* () {
      const nc = yield* connection
      const batchId = nuid.next()

      const commit = yield* Effect.try({
        try: () => {
          const messages = batch.map((event, index) =>
            batchMessage(prefix, runId, event, {
              batchId,
              position: index + 1,
              expected: index === 0 ? expected : undefined,
              commit: index === batch.length - 1,
            }),
          )

          for (const message of messages.slice(0, -1)) {
            nc.publish(message.subject, message.payload, { headers: message.headers })
          }

          return messages.at(-1)
        },
        catch: natsFailure(`Publishing ${runId} failed`),
      })

      if (!commit) {
        return expected
      }

      const reply = yield* attempt(`Committing ${runId} batch failed`, () =>
        nc.request(commit.subject, commit.payload, { headers: commit.headers, timeout }),
      )

      const response = yield* decodeCommitResponse(reply.string()).pipe(
        Effect.mapError(natsFailure(`Unreadable commit reply for ${runId}`)),
      )

      if ('error' in response) {
        const errCode = response.error.err_code
        const conflict = errCode === WRONG_LAST_SEQUENCE

        return yield* new NatsProjectorError({
          message: conflict
            ? `Another writer published to ${runId} first (${response.error.description})`
            : `JetStream refused the ${runId} batch: ${response.error.description}`,
          errCode,
        })
      }

      return response.seq
    })

  const projectRun = (runId: string, events: readonly EventEnvelope[]) =>
    Effect.gen(function* () {
      const tail = yield* readTail(runId)
      const pending = yield* unpublished(runId, tail, events)
      let expected = tail.streamSeq

      for (const batch of chunk(pending, maxBatch)) {
        expected = yield* publishBatch(runId, batch, expected)
      }
    })

  return {
    name,
    version: '1',
    init,
    position: (runId) =>
      init().then(() =>
        Effect.runPromise(readTail(runId).pipe(Effect.map((tail) => tail.loomsSeq))),
      ),
    project: (events) => {
      if (events.length === 0) {
        return Promise.resolve()
      }

      return init().then(() =>
        Effect.runPromise(
          Effect.forEach(groupByRun(events), ([runId, batch]) => projectRun(runId, batch), {
            discard: true,
          }),
        ),
      )
    },
    dispose: () => {
      const owned = opened
      opened = undefined
      live = undefined
      manager = undefined
      ready = undefined

      if (!owned) {
        return Promise.resolve()
      }

      return owned.then(
        (nc) => (nc.isClosed() ? undefined : nc.drain()),
        () => undefined,
      )
    },
  }
}
