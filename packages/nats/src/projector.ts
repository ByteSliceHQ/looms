import { Effect } from 'effect'

import { encodeLoomsEvent, isJsonObject, readAttributes, type EventEnvelope } from '@looms/core'
import { ReplicaGapError, type Projector } from '@looms/projectors'

import {
  anyAttributeTokens,
  attributeTokens,
  attributeTokensOf,
  eventSubject,
  isValidSubjectPrefix,
  runSubjectFilter,
  streamSubject,
} from './subjects'
import {
  NatsProjectorError,
  SERVER_BATCH_LIMIT,
  natsConnectionTransport,
  type NatsConnectionSource,
  type NatsOutgoingMessage,
  type NatsProjectorTransport,
  type NatsStreamSettings,
} from './transport'

/** Headers on every message, so consumers can route without decoding the body. */
export const LoomsHeaders = {
  runId: 'Looms-Run-Id',
  seq: 'Looms-Seq',
  eventId: 'Looms-Event-Id',
  type: 'Looms-Type',
  threadId: 'Looms-Thread-Id',
  ephemeral: 'Looms-Ephemeral',
} as const

export interface NatsProjectorSettings {
  /**
   * Subject prefix; events go to `<prefix>.run.<runId>.<type>`, or with `subjectAttributes` to
   * `<prefix>.run.<attributes>.<runId>.<type>`. Defaults to `looms`.
   */
  readonly subjectPrefix?: string
  /**
   * Run attributes to put in every subject of a run, in this order, before the run id. With
   * `['orgId', 'projectId']`, `<prefix>.run.<orgId>.<projectId>.>` is one project's events and
   * the server does the filtering. A run without one of them has the empty token, `~`, there.
   *
   * The names and their order are the stream's layout: changing them later strands the runs
   * already in the stream under the old subjects.
   */
  readonly subjectAttributes?: readonly string[]
  /** Events per atomic batch. At most what the transport takes, which is also the default. */
  readonly maxBatch?: number
  /** Projector name for delivery cursors and diagnostics. Defaults to `nats`. */
  readonly name?: string
}

export type NatsProjectorOptions = NatsProjectorSettings &
  (
    | (NatsConnectionSource & NatsStreamSettings & { readonly transport?: never })
    | {
        /** How to reach the stream when the host can't hold a NATS connection. */
        readonly transport: NatsProjectorTransport
      }
  )

interface RunTail {
  /** Last Looms seq published for the run, 0 when none. */
  readonly loomsSeq: number
  /** Stream sequence of that message, 0 when none. The next batch must expect exactly this. */
  readonly streamSeq: number
  /** The attribute tokens of the run's subjects, when the stream holds a message of the run. */
  readonly scope: readonly string[] | undefined
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

/** The run's attribute tokens from its started event, when the batch holds it. */
function startedScope(
  names: readonly string[],
  events: readonly EventEnvelope[],
): readonly string[] | undefined {
  const started = events.find((event) => event.type === 'runtime.run.started' && !event.ephemeral)

  if (!started) {
    return undefined
  }

  const payload = isJsonObject(started.payload) ? started.payload : {}

  return attributeTokens(names, readAttributes(payload.attributes))
}

function outgoing(
  prefix: string,
  runId: string,
  scope: readonly string[],
  event: EventEnvelope,
): NatsOutgoingMessage {
  const headers = [
    [LoomsHeaders.runId, runId],
    [LoomsHeaders.seq, String(event.seq)],
    [LoomsHeaders.eventId, event.id],
    [LoomsHeaders.type, event.type],
  ]

  if (event.threadId) {
    headers.push([LoomsHeaders.threadId, event.threadId])
  }

  if (event.ephemeral) {
    headers.push([LoomsHeaders.ephemeral, 'true'])
  }

  return {
    subject: eventSubject(prefix, runId, event.type, scope),
    payload: JSON.stringify(encodeLoomsEvent(event)),
    headers: Object.fromEntries(headers),
  }
}

/**
 * Replicates committed events to a NATS JetStream stream, one subject per event:
 * `<prefix>.run.<runId>.<type tokens>`, with the run's `subjectAttributes` before the run id
 * when they are set. The body is the JSON envelope.
 *
 * Each batch lands whole or not at all, and expects the run's last stream sequence, so a
 * concurrent writer or a hole in the run is refused instead of reordering the copy. `position`
 * reads the run's last message, so durable delivery rewinds and catches up when the stream is
 * behind its cursor.
 *
 * Pass a NATS connection, or a `transport` when the host reaches the stream some other way.
 * Over a connection it requires nats-server 2.12 or newer (atomic batch publish).
 */
export function natsProjector(options: NatsProjectorOptions): Projector {
  const prefix = options.subjectPrefix ?? 'looms'
  const names = options.subjectAttributes ?? []
  const name = options.name ?? 'nats'

  if (!isValidSubjectPrefix(prefix)) {
    throw new NatsProjectorError({
      message: `Subject prefix "${prefix}" must be dot-separated [A-Za-z0-9_-] tokens`,
    })
  }

  const transport =
    options.transport ?? natsConnectionTransport({ ...options, subjects: [streamSubject(prefix)] })

  const limit = Math.min(transport.maxBatch ?? SERVER_BATCH_LIMIT, SERVER_BATCH_LIMIT)
  const maxBatch = Math.min(options.maxBatch ?? limit, limit)

  if (!Number.isInteger(maxBatch) || maxBatch < 1) {
    throw new NatsProjectorError({ message: 'maxBatch must be a positive integer' })
  }

  let ready: Promise<void> | undefined

  const init = (): Promise<void> => {
    ready ??= Effect.runPromise(transport.init?.() ?? Effect.void).catch((cause: unknown) => {
      ready = undefined
      throw cause
    })

    return ready
  }

  /**
   * The run's last message. `scope` is the run's attribute tokens when the caller knows them;
   * without it the read matches the run under any attributes and learns them from the subject.
   */
  const readTail = (runId: string, scope?: readonly string[]) =>
    Effect.gen(function* () {
      const last = yield* transport.last(
        runSubjectFilter(prefix, runId, scope ?? anyAttributeTokens(names.length)),
      )

      if (!last) {
        return { loomsSeq: 0, streamSeq: 0, scope: undefined } satisfies RunTail
      }

      const loomsSeq = Number(last.headers[LoomsHeaders.seq])

      if (!Number.isSafeInteger(loomsSeq) || loomsSeq < 1) {
        return yield* new NatsProjectorError({
          message: `Message ${last.streamSeq} on ${last.subject} has no ${LoomsHeaders.seq} header`,
        })
      }

      return {
        loomsSeq,
        streamSeq: last.streamSeq,
        scope: attributeTokensOf(last.subject, prefix, names.length),
      } satisfies RunTail
    })

  const projectRun = (runId: string, events: readonly EventEnvelope[]) =>
    Effect.gen(function* () {
      const tail = yield* readTail(runId, startedScope(names, events))
      const pending = yield* unpublished(runId, tail, events)

      // What the stream already files the run under wins. A run it has never seen is filed by
      // its started event, and by empty tokens when the batch does not hold one.
      const scope = tail.scope ?? startedScope(names, events) ?? attributeTokens(names, undefined)
      const filter = runSubjectFilter(prefix, runId, scope)
      let expected = tail.streamSeq

      for (const batch of chunk(pending, maxBatch)) {
        expected = yield* transport.commit({
          filter,
          expected,
          messages: batch.map((event) => outgoing(prefix, runId, scope, event)),
        })
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
      ready = undefined

      return Effect.runPromise(transport.dispose?.() ?? Effect.void)
    },
  }
}
