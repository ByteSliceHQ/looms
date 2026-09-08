import { Context, Effect, Layer, Queue, Ref, Stream } from 'effect'
import { withAssignedSeq, type AppendableLoomsEvent, type LoomsEvent } from './events'

export class EventStoreError extends Error {
  readonly _tag: 'EventStoreError' | 'EventStoreConflictError' = 'EventStoreError'
  readonly conflict?: boolean
  override readonly cause?: unknown
  constructor(message: string, cause?: unknown, options?: { conflict?: boolean }) {
    super(message)
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
  constructor(actorId: string, expectedTail: number, actualTail: number) {
    super(
      `Conflict appending to ${actorId}: expected tail ${expectedTail}, got ${actualTail}`,
      undefined,
      { conflict: true },
    )
    this.name = 'EventStoreConflictError'
    this.expectedTail = expectedTail
    this.actualTail = actualTail
  }
}

export interface AppendResult {
  /** Assigned sequence numbers for the appended batch (inclusive end = last). */
  sequences: number[]
  tail: number
}

export interface EventStore {
  readonly append: (
    actorId: string,
    events: ReadonlyArray<AppendableLoomsEvent>,
    options?: { expectedTail?: number },
  ) => Effect.Effect<AppendResult, EventStoreError>

  readonly read: (
    actorId: string,
    options?: { fromSeq?: number; limit?: number },
  ) => Effect.Effect<LoomsEvent[], EventStoreError>

  readonly tail: (actorId: string) => Effect.Effect<number, EventStoreError>

  readonly subscribe: (
    actorId: string,
    options?: { fromSeq?: number },
  ) => Stream.Stream<LoomsEvent, EventStoreError>

  readonly listActors: () => Effect.Effect<string[], EventStoreError>
}

export class EventStoreTag extends Context.Service<EventStoreTag, EventStore>()('looms/EventStore') {}

interface ActorLog {
  events: LoomsEvent[]
  waiters: Array<(event: LoomsEvent) => void>
}

export const makeMemoryEventStore = Effect.gen(function* () {
  const logs = yield* Ref.make(new Map<string, ActorLog>())

  const getOrCreate = (map: Map<string, ActorLog>, actorId: string): ActorLog => {
    const existing = map.get(actorId)
    if (existing) return existing
    const created: ActorLog = { events: [], waiters: [] }
    map.set(actorId, created)
    return created
  }

  const service: EventStore = {
    append: (actorId, events, options) =>
      Effect.gen(function* () {
        const sequences: number[] = []
        yield* Ref.update(logs, (map) => {
          const next = new Map(map)
          const log = getOrCreate(next, actorId)
          if (options?.expectedTail !== undefined && log.events.length !== options.expectedTail) {
            throw new EventStoreConflictError(actorId, options.expectedTail, log.events.length)
          }
          const appended: LoomsEvent[] = []
          for (const partial of events) {
            const seq = log.events.length + appended.length + 1
            const event = withAssignedSeq(partial, actorId, seq)
            appended.push(event)
            sequences.push(seq)
          }
          const updated: ActorLog = {
            events: [...log.events, ...appended],
            waiters: log.waiters,
          }
          next.set(actorId, updated)
          for (const event of appended) {
            for (const waiter of log.waiters) waiter(event)
          }
          return next
        }).pipe(
          Effect.catchDefect((cause) =>
            Effect.fail(cause instanceof EventStoreError ? cause : new EventStoreError('append failed', cause)),
          ),
        )
        const tail = yield* service.tail(actorId)
        return { sequences, tail }
      }),

    read: (actorId, options) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        const log = map.get(actorId)
        if (!log) return []
        const fromSeq = options?.fromSeq ?? 1
        const sliced = log.events.filter((e) => e.seq >= fromSeq)
        return options?.limit !== undefined ? sliced.slice(0, options.limit) : sliced
      }),

    tail: (actorId) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        return map.get(actorId)?.events.length ?? 0
      }),

    subscribe: (actorId, options) =>
      Stream.callback<LoomsEvent, EventStoreError>((queue) =>
        Effect.gen(function* () {
          const fromSeq = options?.fromSeq ?? 1
          const map = yield* Ref.get(logs)
          const log = getOrCreate(map, actorId)
          yield* Ref.update(logs, (m) => {
            const n = new Map(m)
            if (!n.has(actorId)) n.set(actorId, log)
            return n
          })
          for (const event of log.events) {
            if (event.seq >= fromSeq) Queue.offerUnsafe(queue, event)
          }
          const waiter = (event: LoomsEvent) => {
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

    listActors: () =>
      Effect.gen(function* () {
        const map = yield* Ref.get(logs)
        return [...map.keys()]
      }),
  }

  return service
})

export const MemoryEventStoreLive = Layer.effect(EventStoreTag, makeMemoryEventStore)
