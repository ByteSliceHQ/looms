import { Context, Effect, Layer, Queue, Ref, Stream } from 'effect'
import { withAssignedSeq, type AppendableEvent, type EventEnvelope } from './envelope'

export class EventStoreError extends Error {
  readonly _tag: 'EventStoreError' | 'EventStoreConflictError' = 'EventStoreError'
  readonly conflict?: boolean
  override readonly cause?: unknown
  constructor(text: string, cause?: unknown, options?: { conflict?: boolean }) {
    super(text)
    this.name = 'EventStoreError'
    this.cause = cause
    this.conflict = options?.conflict
  }
}

export class EventStoreConflictError extends EventStoreError {
  override readonly _tag = 'EventStoreConflictError'
  override readonly conflict: true = true
  readonly expectedTail: number
  readonly actualTail: number
  constructor(runId: string, expectedTail: number, actualTail: number) {
    super(`Conflict appending to ${runId}: expected tail ${expectedTail}, got ${actualTail}`, undefined, {
      conflict: true,
    })
    this.name = 'EventStoreConflictError'
    this.expectedTail = expectedTail
    this.actualTail = actualTail
  }
}

export interface AppendResult {
  sequences: number[]
  tail: number
}

export interface EventStore {
  readonly append: (
    runId: string,
    events: ReadonlyArray<AppendableEvent>,
    options?: { expectedTail?: number },
  ) => Effect.Effect<AppendResult, EventStoreError>

  readonly read: (
    runId: string,
    options?: { fromSeq?: number; limit?: number },
  ) => Effect.Effect<EventEnvelope[], EventStoreError>

  readonly tail: (runId: string) => Effect.Effect<number, EventStoreError>

  readonly subscribe: (
    runId: string,
    options?: { fromSeq?: number },
  ) => Stream.Stream<EventEnvelope, EventStoreError>

  readonly listRuns: () => Effect.Effect<string[], EventStoreError>
}

export class EventStoreTag extends Context.Service<EventStoreTag, EventStore>()('looms/EventStore') {}

interface RunLog {
  events: EventEnvelope[]
  waiters: Array<(event: EventEnvelope) => void>
}

export const makeMemoryEventStore = Effect.gen(function* () {
  const logs = yield* Ref.make(new Map<string, RunLog>())

  const getOrCreate = (map: Map<string, RunLog>, runId: string): RunLog => {
    const existing = map.get(runId)
    if (existing) return existing
    const created: RunLog = { events: [], waiters: [] }
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
          if (options?.expectedTail !== undefined && log.events.length !== options.expectedTail) {
            throw new EventStoreConflictError(runId, options.expectedTail, log.events.length)
          }
          const appended: EventEnvelope[] = []
          for (const partial of events) {
            const seq = log.events.length + appended.length + 1
            const event = withAssignedSeq(partial, runId, seq)
            appended.push(event)
            sequences.push(seq)
          }
          const updated: RunLog = {
            events: [...log.events, ...appended],
            waiters: log.waiters,
          }
          next.set(runId, updated)
          for (const event of appended) {
            for (const waiter of log.waiters) waiter(event)
          }
          return next
        }).pipe(
          Effect.catchDefect((cause) =>
            Effect.fail(cause instanceof EventStoreError ? cause : new EventStoreError('append failed', cause)),
          ),
        )
        const tail = yield* service.tail(runId)
        return { sequences, tail }
      }),

    read: (runId, options) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        const log = map.get(runId)
        if (!log) return []
        const fromSeq = options?.fromSeq ?? 1
        const sliced = log.events.filter((e) => e.seq >= fromSeq)
        return options?.limit !== undefined ? sliced.slice(0, options.limit) : sliced
      }),

    tail: (runId) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        return map.get(runId)?.events.length ?? 0
      }),

    subscribe: (runId, options) =>
      Stream.callback<EventEnvelope, EventStoreError>((queue) =>
        Effect.gen(function* () {
          const fromSeq = options?.fromSeq ?? 1
          const map = yield* Ref.get(logs)
          const log = getOrCreate(map, runId)
          yield* Ref.update(logs, (m) => {
            const n = new Map(m)
            if (!n.has(runId)) n.set(runId, log)
            return n
          })
          for (const event of log.events) {
            if (event.seq >= fromSeq) Queue.offerUnsafe(queue, event)
          }
          const waiter = (event: EventEnvelope) => {
            if (event.seq >= fromSeq) Queue.offerUnsafe(queue, event)
          }
          log.waiters.push(waiter)
          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              const idx = log.waiters.indexOf(waiter)
              if (idx >= 0) log.waiters.splice(idx, 1)
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
