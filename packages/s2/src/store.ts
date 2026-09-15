import { AppendInput, AppendRecord, S2, S2Endpoints, S2Error } from '@s2-dev/streamstore'
import { Effect, Layer, Option, Predicate, Queue, Schema, Stream } from 'effect'

import {
  createKeyedSerializer,
  EventStoreConflictError,
  EventStoreError,
  EventStoreFencedError,
  EventStoreTag,
  EventEnvelopeSchema,
  fromWireEvent,
  withSnapshotStore,
  type AppendResult,
  type EventStore,
  type EventEnvelope,
} from '@looms/core'

import { S2ConfigSchema, streamNameForRun, type S2Config } from './config'
import { s2SnapshotStore } from './snapshot-store'

function toStoreError(cause: unknown, message: string): EventStoreError {
  if (cause instanceof EventStoreError) {
    return cause
  }

  const detail = cause instanceof Error ? cause.message : String(cause)
  return new EventStoreError(`${message}: ${detail}`, cause)
}

function isUnsatisfiableCause(cause: unknown): boolean {
  if (cause instanceof S2Error && (cause.status === 404 || cause.status === 416)) {
    return true
  }

  if (Predicate.isReadonlyObject(cause) && (cause.status === 404 || cause.status === 416)) {
    return true
  }

  const text = cause instanceof Error ? cause.message : String(cause)
  return text.includes('out of range') || text.includes('Range not satisfiable')
}

export interface S2ReadBatchLike<T> {
  readonly records: ReadonlyArray<T>
  readonly tail?: { readonly seqNum: number } | null
}

export interface ReadAllPagesOptions {
  readonly fromSeq?: number
  readonly limit?: number
  readonly maxPageSize?: number
}

/**
 * Paginate an S2 stream lazily using Effect Streams.
 *
 * Pulls pages on demand until the stream tail is reached, an empty page is returned,
 * or the caller's optional limit is satisfied.
 */
export function paginateS2Stream<T extends { readonly seqNum: number }>(
  fetchPage: (
    cursor: number,
    count: number,
  ) => Effect.Effect<S2ReadBatchLike<T> | null, EventStoreError>,
  options?: ReadAllPagesOptions,
): Stream.Stream<T, EventStoreError> {
  const fromSeq = options?.fromSeq ?? 0
  const userLimit = options?.limit
  const maxPageSize = options?.maxPageSize ?? 1000

  if (userLimit !== undefined && userLimit <= 0) {
    return Stream.empty
  }

  interface PaginatorState {
    readonly cursor: number
    readonly remaining?: number
  }

  const baseStream = Stream.paginate<PaginatorState, T, EventStoreError>(
    { cursor: fromSeq, remaining: userLimit },
    (state) =>
      Effect.gen(function* () {
        if (state.remaining !== undefined && state.remaining <= 0) {
          return [[], Option.none()] as const
        }

        const count =
          state.remaining !== undefined ? Math.min(maxPageSize, state.remaining) : maxPageSize

        const page = yield* fetchPage(state.cursor, count)

        if (!page || page.records.length === 0) {
          return [[], Option.none()] as const
        }

        const records = page.records.filter((r) => r.seqNum >= fromSeq)

        const nextRemaining =
          state.remaining !== undefined ? state.remaining - records.length : undefined

        const lastRecord = page.records[page.records.length - 1]

        if (!lastRecord || (nextRemaining !== undefined && nextRemaining <= 0)) {
          return [records, Option.none()] as const
        }

        const nextCursor = Math.max(state.cursor + 1, lastRecord.seqNum + 1)

        if (nextCursor <= state.cursor) {
          return [records, Option.none()] as const
        }

        // A byte-capped page is shorter than `count`. Do not trust `page.tail`
        // there — S2 may report the batch end, not the stream tail.
        const shortPage = page.records.length < count

        const reachedTail =
          !shortPage && page.tail?.seqNum !== undefined && nextCursor >= page.tail.seqNum

        if (reachedTail) {
          return [records, Option.none()] as const
        }

        return [records, Option.some({ cursor: nextCursor, remaining: nextRemaining })] as const
      }),
  )

  return userLimit !== undefined ? baseStream.pipe(Stream.take(userLimit)) : baseStream
}

export async function readAllPages<T extends { readonly seqNum: number }>(
  fetchPage: (cursor: number, count: number) => Promise<S2ReadBatchLike<T> | null>,
  options?: ReadAllPagesOptions,
): Promise<T[]> {
  const fetchPageEffect = (cursor: number, count: number) =>
    Effect.tryPromise({
      try: () => fetchPage(cursor, count),
      catch: (cause) => toStoreError(cause, 'S2 page fetch failed'),
    })

  const stream = paginateS2Stream(fetchPageEffect, options)
  return Effect.runPromise(Stream.runCollect(stream))
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
            await basin.streams.create({
              stream: name,
              config: parsed.streamConfig,
            })
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
        if (events.length === 0 && options?.fence === undefined) {
          const tail = yield* service.tail(runId)
          return { sequences: [], tail } satisfies AppendResult
        }

        const stream = yield* ensureStream(runId)
        const fenced = options?.fence !== undefined

        const eventRecords = events.map((partial) => {
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

        const records = fenced ? [AppendRecord.fence(options.fence), ...eventRecords] : eventRecords

        const input = AppendInput.create(records, {
          matchSeqNum: options?.expectedTail,
          fencingToken: options?.fencingToken,
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
          const message = cause instanceof Error ? cause.message.toLowerCase() : String(cause)

          const isFence =
            cause instanceof S2Error &&
            cause.status === 412 &&
            (message.includes('fenc') || message.includes('token'))

          if (isFence) {
            return yield* Effect.fail(
              new EventStoreFencedError(runId, options?.fencingToken ?? options?.fence ?? ''),
            )
          }

          if (
            cause instanceof S2Error &&
            (cause.status === 409 ||
              cause.status === 412 ||
              message.includes('conflict') ||
              message.includes('match'))
          ) {
            const tailCheck = yield* Effect.promise(() => stream.checkTail().catch(() => null))
            const actualTail = tailCheck?.tail?.seqNum ?? 0
            return yield* Effect.fail(
              new EventStoreConflictError(runId, options?.expectedTail ?? 0, actualTail),
            )
          }

          return yield* Effect.fail(toStoreError(cause, `Append failed for ${runId}`))
        }

        const ack = appendResult.ack
        const sequences: number[] = []
        const eventOffset = fenced ? 1 : 0

        for (let i = 0; i < events.length; i++) {
          sequences.push(ack.start.seqNum + eventOffset + i + 1)
        }

        return { sequences, tail: ack.tail.seqNum }
      }),

    readStream: (runId, options) => {
      const fromSeq = options?.fromSeq ?? 1
      const s2From = Math.max(0, fromSeq - 1)

      return Stream.unwrap(
        Effect.gen(function* () {
          const stream = yield* ensureStream(runId)

          const fetchPage = (cursor: number, count: number) =>
            Effect.tryPromise({
              try: async () => {
                try {
                  return await stream.read({
                    start: { from: { seqNum: cursor }, clamp: true },
                    stop: { limits: { count } },
                    ignoreCommandRecords: true,
                  })
                } catch (cause) {
                  if (isUnsatisfiableCause(cause)) {
                    return null
                  }

                  throw cause
                }
              },
              catch: (cause) => toStoreError(cause, `Read failed for ${runId}`),
            })

          const recordStream = paginateS2Stream(fetchPage, {
            fromSeq: s2From,
            limit: options?.limit,
          })

          return recordStream.pipe(Stream.map((r) => parseEvent(r.body, r.seqNum)))
        }),
      )
    },

    read: (runId, options) =>
      Effect.gen(function* () {
        const stream = service.readStream!(runId, options)
        return yield* Stream.runCollect(stream)
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

    bounds: (runId) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)

        const page = yield* Effect.tryPromise({
          try: async () => {
            try {
              return await stream.read({
                start: { from: { seqNum: 0 }, clamp: true },
                stop: { limits: { count: 1 } },
                ignoreCommandRecords: false,
              })
            } catch (cause) {
              if (isUnsatisfiableCause(cause)) {
                return null
              }

              throw cause
            }
          },
          catch: (cause) => toStoreError(cause, `Bounds failed for ${runId}`),
        })

        const tail = page?.tail?.seqNum ?? 0
        const first = page?.records[0]
        const head = first ? first.seqNum + 1 : tail + 1
        return { head, tail }
      }),

    trim: (runId, beforeSeq) =>
      Effect.gen(function* () {
        const stream = yield* ensureStream(runId)
        const trimTo = Math.max(0, beforeSeq - 1)

        yield* Effect.tryPromise({
          try: () =>
            appends.run(runId, () =>
              stream.append(AppendInput.create([AppendRecord.trim(trimTo)])),
            ),
          catch: (cause) => toStoreError(cause, `Trim failed for ${runId}`),
        })
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
                ignoreCommandRecords: true,
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

  return withSnapshotStore(service, s2SnapshotStore(parsed))
}

export const makeS2EventStore = (config: S2Config): Effect.Effect<EventStore, EventStoreError> =>
  Effect.try({
    try: () => s2(config),
    catch: (cause) => new EventStoreError('Failed to initialize S2 event store', cause),
  })

export const S2EventStoreLive = (config: S2Config) =>
  Layer.effect(EventStoreTag, makeS2EventStore(config))
