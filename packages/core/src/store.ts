import { Context, Data, Effect, Layer, Option, Queue, Ref, Stream } from 'effect'

import { withAssignedSeq, type AppendableEvent, type EventEnvelope } from './envelope'

export class EventStoreError extends Data.TaggedError('EventStoreError')<{
  readonly message: string
  readonly cause?: unknown
  readonly conflict?: boolean
}> {
  override readonly conflict?: boolean
  override readonly cause?: unknown

  constructor(text: string, cause?: unknown, options?: { conflict?: boolean }) {
    super({ message: text, cause, conflict: options?.conflict })
    this.name = 'EventStoreError'
    this.cause = cause
    this.conflict = options?.conflict
  }
}

export class EventStoreConflictError extends Data.TaggedError('EventStoreConflictError')<{
  readonly runId: string
  readonly expectedTail: number
  readonly actualTail: number
  readonly message: string
  readonly cause?: unknown
}> {
  readonly conflict = true

  constructor(runId: string, expectedTail: number, actualTail: number, cause?: unknown) {
    super({
      runId,
      expectedTail,
      actualTail,
      message: `Conflict appending to ${runId}: expected tail ${expectedTail}, got ${actualTail}`,
      cause,
    })

    this.name = 'EventStoreConflictError'
  }
}

export class EventStoreTruncationError extends Data.TaggedError('EventStoreTruncationError')<{
  readonly runId: string
  readonly readCount: number
  readonly tail: number
  readonly message: string
}> {
  constructor(runId: string, readCount: number, tail: number) {
    super({
      runId,
      readCount,
      tail,
      message: `store.read returned ${readCount} events but tail is ${tail}; refusing to dispatch from a truncated log`,
    })

    this.name = 'EventStoreTruncationError'
  }
}

export class EventStoreTrimmedError extends Data.TaggedError('EventStoreTrimmedError')<{
  readonly runId: string
  readonly head: number
  readonly requestedSeq: number
  readonly message: string
}> {
  constructor(runId: string, head: number, requestedSeq: number) {
    super({
      runId,
      head,
      requestedSeq,
      message: `store head is ${head} but requested seq ${requestedSeq} for run "${runId}"; history was trimmed and no covering snapshot is available`,
    })

    this.name = 'EventStoreTrimmedError'
  }
}

export class EventStoreFencedError extends Data.TaggedError('EventStoreFencedError')<{
  readonly runId: string
  readonly token: string
  readonly message: string
}> {
  constructor(runId: string, token: string) {
    super({
      runId,
      token,
      message: `Fencing token mismatch for run "${runId}"; token "${token}" is no longer current`,
    })

    this.name = 'EventStoreFencedError'
  }
}

export type EventStoreAppendError =
  | EventStoreError
  | EventStoreConflictError
  | EventStoreFencedError
export type AnyEventStoreError =
  | EventStoreError
  | EventStoreConflictError
  | EventStoreTruncationError
  | EventStoreTrimmedError
  | EventStoreFencedError

export function isEventStoreError(err: unknown): err is AnyEventStoreError {
  return (
    err instanceof EventStoreError ||
    err instanceof EventStoreConflictError ||
    err instanceof EventStoreTruncationError ||
    err instanceof EventStoreTrimmedError ||
    err instanceof EventStoreFencedError
  )
}

export interface StreamBounds {
  readonly head: number
  readonly tail: number
}

export interface AppendOptions {
  readonly expectedTail?: number
  /** Set the stream fencing token atomically in this batch (`''` clears). */
  readonly fence?: string
  /** Must match the stream's current fencing token, or the append fails. */
  readonly fencingToken?: string
}

export interface PaginatePagesOptions<SCursor> {
  readonly initialCursor: SCursor
  readonly limit?: number
}

/**
 * Pure Effect-native stream pagination primitive.
 *
 * Lazily pulls pages using `fetchPage` until:
 * 1. `fetchPage` returns null or an empty record list,
 * 2. `nextCursor` is null/undefined (signaling stream exhaustion / tail reached),
 * 3. Or the caller's optional `limit` is satisfied (avoiding subsequent page fetches).
 */
export function paginatePages<T, SCursor, E = never, R = never>(
  options: PaginatePagesOptions<SCursor>,
  fetchPage: (cursor: SCursor) => Effect.Effect<
    {
      readonly records: ReadonlyArray<T>
      readonly nextCursor?: SCursor | null
    } | null,
    E,
    R
  >,
): Stream.Stream<T, E, R> {
  const baseStream = Stream.paginate(options.initialCursor, (cursor) =>
    Effect.gen(function* () {
      const page = yield* fetchPage(cursor)

      if (!page || page.records.length === 0 || page.nextCursor == null) {
        return [page?.records ?? [], Option.none()] as const
      }

      return [page.records, Option.some(page.nextCursor)] as const
    }),
  )

  return options.limit !== undefined ? baseStream.pipe(Stream.take(options.limit)) : baseStream
}

export interface AppendResult {
  sequences: number[]
  tail: number
}

export interface EventStore {
  readonly append: (
    runId: string,
    events: ReadonlyArray<AppendableEvent>,
    options?: AppendOptions,
  ) => Effect.Effect<AppendResult, EventStoreAppendError>

  /**
   * Reads events for a run in sequence order.
   *
   * Contract:
   * - If `limit` is omitted, returns every event from `fromSeq` (default 1) through
   *   the current stream tail. Implementations must page internally if the backing
   *   storage limits unary reads (e.g. S2 1000-record / 1 MiB limits).
   * - If `limit` is provided, returns at most `limit` events starting from `fromSeq`.
   *   Callers using `limit` must page with their own cursor.
   * - If the stream does not exist or has no events at or beyond `fromSeq`, returns an empty array.
   */
  readonly read: (
    runId: string,
    options?: { fromSeq?: number; limit?: number },
  ) => Effect.Effect<EventEnvelope[], EventStoreError>

  /**
   * Reads events for a run as an interruptible stream in sequence order.
   */
  readonly readStream?: (
    runId: string,
    options?: { fromSeq?: number; limit?: number },
  ) => Stream.Stream<EventEnvelope, EventStoreError>

  readonly tail: (runId: string) => Effect.Effect<number, EventStoreError>

  /**
   * Sequence bounds of the retained log.
   * `head` is the seq of the first retained record (1 when nothing trimmed, `tail + 1` when empty).
   */
  readonly bounds?: (runId: string) => Effect.Effect<StreamBounds, EventStoreError>

  /** Discard records with `seq < beforeSeq`. */
  readonly trim?: (runId: string, beforeSeq: number) => Effect.Effect<void, EventStoreError>

  readonly subscribe: (
    runId: string,
    options?: { fromSeq?: number },
  ) => Stream.Stream<EventEnvelope, EventStoreError>

  readonly listRuns: () => Effect.Effect<string[], EventStoreError>
}

/**
 * Utility to read an EventStore as a Stream.Stream, using `store.readStream` if implemented
 * or falling back to `Stream.fromIterableEffect(store.read(...))`.
 */
export function readEventStream(
  store: EventStore,
  runId: string,
  options?: { fromSeq?: number; limit?: number },
): Stream.Stream<EventEnvelope, EventStoreError> {
  if (store.readStream) {
    return store.readStream(runId, options)
  }

  return Stream.fromIterableEffect(store.read(runId, options))
}

export class EventStoreTag extends Context.Service<EventStoreTag, EventStore>()(
  'looms/EventStore',
) {}

interface RunLog {
  events: EventEnvelope[]
  waiters: Array<(event: EventEnvelope) => void>
  head: number
  tail: number
  fenceToken?: string
}

export const makeMemoryEventStore = Effect.gen(function* () {
  const logs = yield* Ref.make(new Map<string, RunLog>())

  const getOrCreate = (map: Map<string, RunLog>, runId: string): RunLog => {
    const existing = map.get(runId)

    if (existing) {
      return existing
    }

    const created: RunLog = { events: [], waiters: [], head: 1, tail: 0 }
    map.set(runId, created)
    return created
  }

  const service: EventStore = {
    append: (runId, events, options) =>
      Effect.gen(function* () {
        const sequences: number[] = []

        yield* Ref.update(logs, (map) => {
          const next = new Map(map)
          const log = getOrCreate(next, runId)

          if (options?.expectedTail !== undefined && log.tail !== options.expectedTail) {
            throw new EventStoreConflictError(runId, options.expectedTail, log.tail)
          }

          if (options?.fencingToken !== undefined && log.fenceToken !== options.fencingToken) {
            throw new EventStoreFencedError(runId, options.fencingToken)
          }

          let nextTail = log.tail
          let fenceToken = log.fenceToken

          if (options?.fence !== undefined) {
            nextTail += 1
            fenceToken = options.fence === '' ? undefined : options.fence
          }

          const appended: EventEnvelope[] = []

          for (const partial of events) {
            const seq = nextTail + appended.length + 1
            const event = withAssignedSeq(partial, runId, seq)
            appended.push(event)
            sequences.push(seq)
          }

          nextTail += appended.length

          const updated: RunLog = {
            events: [...log.events, ...appended],
            waiters: log.waiters,
            head: log.head,
            tail: nextTail,
            fenceToken,
          }

          next.set(runId, updated)

          for (const event of appended) {
            for (const waiter of log.waiters) {
              waiter(event)
            }
          }

          return next
        }).pipe(
          Effect.catchDefect((cause) =>
            Effect.fail(
              cause instanceof EventStoreConflictError ||
                cause instanceof EventStoreFencedError ||
                cause instanceof EventStoreError
                ? cause
                : new EventStoreError('append failed', cause),
            ),
          ),
        )

        const tail = yield* service.tail(runId)
        return { sequences, tail }
      }),

    read: (runId, options) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        const log = map.get(runId)

        if (!log) {
          return []
        }

        const fromSeq = Math.max(options?.fromSeq ?? 1, log.head)
        const sliced = log.events.filter((e) => e.seq >= fromSeq)
        return options?.limit !== undefined ? sliced.slice(0, options.limit) : sliced
      }),

    readStream: (runId, options) => Stream.fromIterableEffect(service.read(runId, options)),

    tail: (runId) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        return map.get(runId)?.tail ?? 0
      }),

    bounds: (runId) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        const log = map.get(runId)

        if (!log) {
          return { head: 1, tail: 0 }
        }

        return { head: log.head, tail: log.tail }
      }),

    trim: (runId, beforeSeq) =>
      Effect.gen(function* () {
        yield* Ref.update(logs, (map) => {
          const log = map.get(runId)

          if (!log) {
            return map
          }

          const next = new Map(map)
          const retained = log.events.filter((e) => e.seq >= beforeSeq)

          next.set(runId, {
            ...log,
            events: retained,
            head: Math.max(log.head, beforeSeq),
          })

          return next
        })
      }),

    subscribe: (runId, options) =>
      Stream.callback<EventEnvelope, EventStoreError>((queue) =>
        Effect.gen(function* () {
          const fromSeq = options?.fromSeq ?? 1
          const map = yield* Ref.get(logs)
          const log = getOrCreate(map, runId)

          yield* Ref.update(logs, (m) => {
            const n = new Map(m)

            if (!n.has(runId)) {
              n.set(runId, log)
            }

            return n
          })

          for (const event of log.events) {
            if (event.seq >= fromSeq) {
              Queue.offerUnsafe(queue, event)
            }
          }

          const waiter = (event: EventEnvelope) => {
            if (event.seq >= fromSeq) {
              Queue.offerUnsafe(queue, event)
            }
          }

          log.waiters.push(waiter)

          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              const idx = log.waiters.indexOf(waiter)

              if (idx >= 0) {
                log.waiters.splice(idx, 1)
              }
            }),
          )
        }),
      ),

    listRuns: () =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        return [...map.keys()]
      }),
  }

  return service
})

export const MemoryEventStoreLive = Layer.effect(EventStoreTag, makeMemoryEventStore)
