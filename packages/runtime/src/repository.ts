import { Clock, Data, Effect, Option } from 'effect'

import {
  advanceCursor,
  assignSequences,
  createCoalescingAppender,
  emptyCursor,
  EventStoreTrimmedError,
  hashRunState,
  trimEventStoreSafely,
  type AppendableEvent,
  type AppendResult,
  type ComposedRegistry,
  type EventEnvelope,
  type EventStore,
  type EventStoreAppendError,
  type EventStoreError,
  type EventStoreTrimCoverage,
  type EventStoreTruncationError,
  type RunCursor,
  type SnapshotStore,
} from '@looms/core'

import { RuntimeExecutionError } from './errors'
import type { RunCursorCache } from './helpers'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RunExecutionContexts } from './run-execution-context'

class LiveAppendError extends Data.TaggedError('LiveAppendError')<{
  readonly message: string
}> {
  constructor() {
    super({ message: 'Cannot append live events without a store' })
    this.name = 'LiveAppendError'
  }
}

function currentTimeMillis(): number {
  return Math.floor(performance.timeOrigin + performance.now())
}

function readRemaining(
  store: EventStore,
  runId: string,
  events: EventEnvelope[],
  expectedTail?: number,
): Effect.Effect<EventEnvelope[], EventStoreError> {
  return Effect.gen(function* () {
    let collected = events

    while (collected.length > 0) {
      const lastSeq = collected[collected.length - 1]!.seq
      const target = expectedTail ?? (yield* store.tail(runId))

      if (lastSeq >= target) {
        break
      }

      const more = yield* store.read(runId, {
        fromSeq: lastSeq + 1,
        limit: expectedTail !== undefined ? Math.max(0, target - lastSeq) : undefined,
      })

      if (more.length === 0 || more[0]!.seq <= lastSeq) {
        break
      }

      collected = [...collected, ...more]
    }

    return collected
  })
}

export interface RuntimeRepositoryOptions {
  readonly registry: ComposedRegistry
  readonly snapshotStore: SnapshotStore
  readonly trimAfterSnapshot?: {
    readonly keepSnapshots: number
    readonly coverage?: (runId: string) => EventStoreTrimCoverage | Promise<EventStoreTrimCoverage>
  }
  readonly keepSnapshots: number
  readonly runCache: RunCursorCache
  readonly executionContexts: RunExecutionContexts
  readonly observer?: RuntimeObserver
}

export function createRuntimeRepository(options: RuntimeRepositoryOptions) {
  const { registry, snapshotStore, trimAfterSnapshot, keepSnapshots, runCache, executionContexts } =
    options

  const observe = (event: Parameters<RuntimeObserver['observe']>[0]) =>
    notifyObserver(options.observer, event)

  const appendObserved = (
    store: EventStore,
    runId: string,
    events: ReadonlyArray<AppendableEvent>,
    appendOptions?: Parameters<EventStore['append']>[2],
  ): Effect.Effect<AppendResult, EventStoreAppendError> =>
    Effect.suspend(() => {
      const startedAt = currentTimeMillis()
      return store.append(runId, events, appendOptions).pipe(
        Effect.tap(() =>
          Effect.sync(() =>
            observe({
              type: 'event.append',
              runId,
              at: currentTimeMillis(),
              eventCount: events.length,
              latencyMs: currentTimeMillis() - startedAt,
              outcome: 'ok',
            }),
          ),
        ),
        Effect.tapError((error) =>
          Effect.sync(() =>
            observe({
              type: 'event.append',
              runId,
              at: currentTimeMillis(),
              eventCount: events.length,
              latencyMs: currentTimeMillis() - startedAt,
              outcome: error._tag === 'EventStoreConflictError' ? 'conflict' : 'error',
            }),
          ),
        ),
      )
    })

  const liveAppends = createCoalescingAppender<
    AppendableEvent,
    EventStoreAppendError | LiveAppendError
  >((runId, batch) => {
    const context = executionContexts.peek(runId)

    if (!context?.liveStore) {
      return Effect.fail(new LiveAppendError())
    }

    const store = context.liveStore

    return appendObserved(store, runId, batch).pipe(
      Effect.tap((result) =>
        Effect.sync(() => {
          context.liveCount += result.sequences.length
        }),
      ),
      Effect.asVoid,
    )
  })

  const catchUp = (
    store: EventStore,
    runId: string,
    cursor: RunCursor,
    expectedTail?: number,
  ): Effect.Effect<
    RunCursor,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError
  > =>
    Effect.gen(function* () {
      if (expectedTail !== undefined && cursor.seq === expectedTail) {
        return cursor
      }

      const fromSeq = cursor.seq + 1
      const limit = expectedTail !== undefined ? Math.max(0, expectedTail - cursor.seq) : undefined
      let delta = yield* store.read(runId, { fromSeq, limit })

      if (delta.length === 0) {
        return cursor
      }

      const firstSeq = delta[0]!.seq

      if (firstSeq > fromSeq) {
        if (store.bounds) {
          const bounds = yield* store.bounds(runId)

          if (bounds.head > fromSeq) {
            return yield* new EventStoreTrimmedError(runId, bounds.head, fromSeq)
          }
        } else {
          return yield* new EventStoreTrimmedError(runId, firstSeq, fromSeq)
        }
      }

      delta = yield* readRemaining(store, runId, delta, expectedTail)

      return advanceCursor(cursor, delta, registry)
    })

  const loadCursorCold = (
    store: EventStore,
    runId: string,
  ): Effect.Effect<
    RunCursor,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError
  > =>
    Effect.gen(function* () {
      let cursor = emptyCursor(runId)

      if (snapshotStore) {
        const loadStartedAt = currentTimeMillis()

        const snap = yield* snapshotStore.loadLatest(runId).pipe(
          Effect.tapError((error) =>
            Effect.sync(() => {
              observe({
                type: 'snapshot.load',
                runId,
                at: currentTimeMillis(),
                latencyMs: currentTimeMillis() - loadStartedAt,
                outcome: 'error',
              })
            }).pipe(
              Effect.andThen(
                Effect.logWarning(
                  `Snapshot load failed for run "${runId}"; replaying the log`,
                  error,
                ),
              ),
            ),
          ),
          Effect.orElseSucceed(() => Option.none()),
        )

        if (Option.isSome(snap)) {
          observe({
            type: 'snapshot.load',
            runId,
            at: currentTimeMillis(),
            latencyMs: currentTimeMillis() - loadStartedAt,
            outcome: 'ok',
            cursor: snap.value.cursor,
          })

          cursor = {
            state: snap.value.state,
            seq: snap.value.cursor,
            durableSinceSnapshot: 0,
          }
        } else {
          observe({
            type: 'snapshot.load',
            runId,
            at: currentTimeMillis(),
            latencyMs: currentTimeMillis() - loadStartedAt,
            outcome: 'miss',
          })
        }
      }

      const fromSeq = cursor.seq + 1
      let delta = yield* store.read(runId, { fromSeq })

      if (cursor.seq === 0 && delta[0] && delta[0].seq > 1) {
        if (store.bounds) {
          const bounds = yield* store.bounds(runId)

          if (bounds.head > 1) {
            return yield* new EventStoreTrimmedError(runId, bounds.head, 1)
          }
        } else {
          return yield* new EventStoreTrimmedError(runId, delta[0].seq, 1)
        }
      }

      if (delta.length > 0) {
        delta = yield* readRemaining(store, runId, delta)
      }

      return advanceCursor(cursor, delta, registry)
    })

  const loadCursor = (
    store: EventStore,
    runId: string,
  ): Effect.Effect<
    RunCursor,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError
  > =>
    Effect.gen(function* () {
      const cached = runCache.get(runId)

      if (cached) {
        const tail = yield* store.tail(runId)

        // A tail behind the cursor means the stream was recreated; the cache is poison.
        if (tail < cached.seq) {
          runCache.delete(runId)
          return yield* loadCursorCold(store, runId)
        }

        if (tail === cached.seq) {
          return cached
        }

        const next = yield* catchUp(store, runId, cached, tail).pipe(
          Effect.catchTag('EventStoreTrimmedError', () => {
            runCache.delete(runId)
            return loadCursorCold(store, runId)
          }),
        )

        runCache.set(runId, next)
        return next
      }

      const next = yield* loadCursorCold(store, runId)
      runCache.set(runId, next)
      return next
    })

  /**
   * Save the current state externally, keep only `keepSnapshots`, and optionally
   * trim the event log behind the oldest kept snapshot. Failures are swallowed:
   * a snapshot is an optimization, the log stays authoritative.
   */
  const persistSnapshot = (
    store: EventStore,
    runId: string,
    cursor: RunCursor,
  ): Effect.Effect<RunCursor> =>
    Effect.gen(function* () {
      if (cursor.durableSinceSnapshot === 0) {
        return cursor
      }

      const takenAt = yield* Clock.currentTimeMillis
      const saveStartedAt = currentTimeMillis()

      yield* snapshotStore.save({
        runId,
        cursor: cursor.seq,
        stateHash: hashRunState(cursor.state),
        takenAt,
        state: cursor.state,
      })

      observe({
        type: 'snapshot.save',
        runId,
        at: currentTimeMillis(),
        latencyMs: currentTimeMillis() - saveStartedAt,
        outcome: 'ok',
        cursor: cursor.seq,
      })

      if (snapshotStore.prune) {
        yield* snapshotStore.prune(runId, keepSnapshots)
      }

      const coverageForRun = trimAfterSnapshot?.coverage

      if (coverageForRun && store.trim && snapshotStore.listCursors) {
        const cursors = yield* snapshotStore.listCursors(runId)
        const oldestKept = cursors[Math.max(0, cursors.length - keepSnapshots)]

        if (oldestKept !== undefined) {
          const trimStartedAt = currentTimeMillis()

          const coverage = yield* Effect.tryPromise({
            try: () => Promise.resolve(coverageForRun(runId)),
            catch: (cause) =>
              new RuntimeExecutionError(cause instanceof Error ? cause.message : String(cause)),
          })

          yield* trimEventStoreSafely(store, runId, oldestKept + 1, coverage)

          observe({
            type: 'snapshot.trim',
            runId,
            at: currentTimeMillis(),
            latencyMs: currentTimeMillis() - trimStartedAt,
            outcome: 'ok',
            cursor: oldestKept,
          })
        }
      }

      return { ...cursor, durableSinceSnapshot: 0 }
    }).pipe(
      Effect.tapError((error) =>
        Effect.logWarning(`Snapshot persistence failed for run "${runId}"`, error),
      ),
      Effect.orElseSucceed(() => cursor),
    )

  const applyAppend = (
    store: EventStore,
    runId: string,
    cursor: RunCursor,
    batch: ReadonlyArray<AppendableEvent>,
    appendResult: AppendResult,
    commandRecords = 0,
  ): Effect.Effect<
    RunCursor,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError
  > =>
    Effect.gen(function* () {
      const echo = assignSequences(batch, appendResult)
      const first = echo[0]
      let next = cursor

      if (first && first.seq !== cursor.seq + 1 + commandRecords) {
        const gap = first.seq - 1 - cursor.seq
        const context = executionContexts.get(runId)

        if (context.liveCount === gap) {
          next = { ...cursor, seq: first.seq - 1 }
        } else {
          next = yield* catchUp(store, runId, cursor, first.seq - 1)
        }
      }

      next = advanceCursor(next, echo, registry)
      executionContexts.get(runId).liveCount = 0

      if (next.seq !== appendResult.tail) {
        next = yield* catchUp(store, runId, next, appendResult.tail)
      }

      runCache.set(runId, next)
      return next
    })

  return {
    appendObserved,
    liveAppends,
    loadCursor,
    persistSnapshot,
    applyAppend,
    deleteCachedCursor: (runId: string) => runCache.delete(runId),
    setCachedCursor: (runId: string, cursor: RunCursor) => runCache.set(runId, cursor),
  }
}

export type RuntimeRepository = ReturnType<typeof createRuntimeRepository>
