import { AppendInput, AppendRecord, S2, S2Endpoints, S2Error } from '@s2-dev/streamstore'
import { Effect, Layer, Queue, Schema, Stream } from 'effect'

import {
  createKeyedSerializer,
  EventStoreConflictError,
  EventStoreError,
  EventStoreTag,
  EventEnvelopeSchema,
  fromWireEvent,
  type AppendResult,
  type EventStore,
  type EventEnvelope,
} from '@looms/core'

import { S2ConfigSchema, streamNameForRun, type S2Config } from './config'

function toStoreError(cause: unknown, message: string): EventStoreError {
  if (cause instanceof EventStoreError) {
    return cause
  }

  const detail = cause instanceof Error ? cause.message : String(cause)
  return new EventStoreError(`${message}: ${detail}`, cause)
}

function isUnsatisfiableRead(err: EventStoreError): boolean {
  const cause = err.cause

  if (cause instanceof S2Error && (cause.status === 404 || cause.status === 416)) {
    return true
  }

  const text = `${err.message} ${cause instanceof Error ? cause.message : ''}`
  return text.includes('out of range') || text.includes('Range not satisfiable')
}

function parseEvent(body: string, seqNum: number): EventEnvelope {
  const raw: unknown = JSON.parse(body)
  const decoded = Schema.decodeUnknownSync(EventEnvelopeSchema)(raw)
  return fromWireEvent({ ...decoded, seq: seqNum + 1 })
}

function createClient(config: S2Config): S2 {
  if (Schema.is(Schema.String)(config.endpoint)) {
    return new S2({
      accessToken: config.accessToken,
      endpoints: new S2Endpoints({
        account: config.endpoint,
        basin: config.endpoint,
      }),
    })
  }

  if (config.endpoint) {
    return new S2({
      accessToken: config.accessToken,
      endpoints: new S2Endpoints(config.endpoint),
    })
  }

  return new S2({ accessToken: config.accessToken })
}

/**
 * Synchronous constructor for an S2-backed EventStore.
 *
 * Basin creation is deferred and memoized lazily on first stream access.
 * Expected tail mismatches during `append` map to `EventStoreConflictError`.
 */
export function s2(config: S2Config): EventStore {
  const parsed = Schema.decodeUnknownSync(S2ConfigSchema)(config)
  const client = createClient(parsed)
  const basin = client.basin(parsed.basin)
  const ensured = new Set<string>()
  const appends = createKeyedSerializer()

  let basinEnsured = false

  const ensureBasin = Effect.tryPromise({
    try: async () => {
      if (basinEnsured) {
        return
      }

      try {
        await client.basins.create({ basin: parsed.basin })
      } catch (err) {
        // 409 = already exists
        if (!(err instanceof S2Error && err.status === 409)) {
          throw err
        }
      }

      basinEnsured = true
    },
    catch: (cause) => toStoreError(cause, `Failed to ensure basin ${parsed.basin}`),
  })

  const ensureStream = (runId: string) =>
    Effect.gen(function* () {
      yield* ensureBasin
      return yield* Effect.tryPromise({
        try: async () => {
          const name = streamNameForRun(runId)

          if (ensured.has(name)) {
            return basin.stream(name)
          }

          try {
            await basin.streams.create({ stream: name })
          } catch (err) {
            // 409 = already exists
            if (!(err instanceof S2Error && err.status === 409)) {
              // Some local servers may not support create; try using the stream anyway.
              if (!(err instanceof S2Error && (err.status === 404 || err.status === 405))) {
                throw err
              }
            }
          }

          ensured.add(name)
          return basin.stream(name)
        },
        catch: (cause) => toStoreError(cause, `Failed to open stream for ${runId}`),
      })
    })

  const service: EventStore = {
    append: (runId, events, options) =>
      Effect.gen(function* () {
        if (events.length === 0) {
          const tail = yield* service.tail(runId)
          return { sequences: [], tail } satisfies AppendResult
        }

        const stream = yield* ensureStream(runId)

        const records = events.map((partial) => {
          const body = JSON.stringify({
            ...partial,
            runId,
            seq: partial.seq ?? 0,
          })

          return AppendRecord.string({
            body,
            headers: [['content-type', 'application/json']],
          })
        })

        const input = AppendInput.create(records, {
          matchSeqNum: options?.expectedTail,
        })

        const appendResult = yield* Effect.promise(() =>
          appends.run(runId, () =>
            stream.append(input).then(
              (ack) => ({ ok: true as const, ack }),
              (err: S2Error | Error) => ({ ok: false as const, err }),
            ),
          ),
        )

        if (!appendResult.ok) {
          const cause = appendResult.err

          if (
            cause instanceof S2Error &&
            (cause.status === 409 ||
              cause.status === 412 ||
              cause.message.toLowerCase().includes('conflict') ||
              cause.message.toLowerCase().includes('match'))
          ) {
            const tailCheck = yield* Effect.promise(() => stream.checkTail().catch(() => null))
            // S2 tail.seqNum represents the stream tail (count of records, aligned with Looms 1-based tail).
            const actualTail = tailCheck?.tail?.seqNum ?? 0
            return yield* Effect.fail(
              new EventStoreConflictError(runId, options?.expectedTail ?? 0, actualTail),
            )
          }

          return yield* Effect.fail(toStoreError(cause, `Append failed for ${runId}`))
        }

        const ack = appendResult.ack
        const sequences: number[] = []

        for (let i = 0; i < events.length; i++) {
          sequences.push(ack.start.seqNum + i + 1)
        }

        return { sequences, tail: ack.tail.seqNum }
      }),

    read: (runId, options) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)
        const fromSeq = options?.fromSeq ?? 1
        const s2From = Math.max(0, fromSeq - 1)
        const limit = options?.limit ?? 1000

        const batch = yield* Effect.tryPromise({
          try: () =>
            stream.read({
              start: { from: { seqNum: s2From }, clamp: true },
              stop: { limits: { count: limit } },
            }),
          catch: (cause) => toStoreError(cause, `Read failed for ${runId}`),
        }).pipe(
          Effect.catch((err) =>
            isUnsatisfiableRead(err) ? Effect.succeed(null) : Effect.fail(err),
          ),
        )

        if (!batch) {
          return []
        }

        return batch.records
          .filter((r) => r.seqNum >= s2From)
          .map((r) => parseEvent(r.body, r.seqNum))
      }),

    tail: (runId) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)

        const res = yield* Effect.tryPromise({
          try: () => stream.checkTail(),
          catch: (cause) => toStoreError(cause, `Tail failed for ${runId}`),
        }).pipe(
          Effect.catch((err) =>
            err.cause instanceof S2Error && err.cause.status === 404
              ? Effect.succeed({ tail: { seqNum: 0, timestamp: new Date(0) } })
              : Effect.fail(err),
          ),
        )

        return res.tail.seqNum
      }),

    subscribe: (runId, options) =>
      Stream.callback<EventEnvelope, EventStoreError>((queue) =>
        Effect.callback<void>((resume) => {
          const fromSeq = options?.fromSeq ?? 1
          const s2From = Math.max(0, fromSeq - 1)
          let stopped = false

          const run = async () => {
            try {
              const stream = await Effect.runPromise(ensureStream(runId))

              const session = await stream.readSession({
                start: { from: { seqNum: s2From }, clamp: true },
              })

              for await (const record of session) {
                if (stopped) {
                  break
                }

                if (record.seqNum < s2From) {
                  continue
                }

                Queue.offerUnsafe(queue, parseEvent(record.body, record.seqNum))
              }

              Queue.endUnsafe(queue)
              resume(Effect.void)
            } catch (cause) {
              await Effect.runPromise(
                Queue.fail(queue, toStoreError(cause, `Subscribe failed for ${runId}`)),
              )

              resume(Effect.void)
            }
          }

          void run()
          return Effect.sync(() => {
            stopped = true
          })
        }),
      ),

    listRuns: () =>
      Effect.tryPromise({
        try: async () => {
          const listed = await basin.streams.list({ prefix: 'runs/' })
          return listed.streams
            .map((s) => s.name)
            .filter((name) => name.startsWith('runs/'))
            .map((name) => name.slice('runs/'.length))
        },
        catch: (cause) => toStoreError(cause, 'listRuns failed'),
      }),
  }

  return service
}

export const makeS2EventStore = (config: S2Config): Effect.Effect<EventStore, EventStoreError> =>
  Effect.try({
    try: () => s2(config),
    catch: (cause) => new EventStoreError('Failed to initialize S2 event store', cause),
  })

export const S2EventStoreLive = (config: S2Config) =>
  Layer.effect(EventStoreTag, makeS2EventStore(config))
