import { Clock, Data, Effect, Option } from 'effect'

import {
  advanceCursor,
  assignSequences,
  createCoalescingAppender,
  emptyCursor,
  EventStoreTrimmedError,
  hashRunState,
  primePinnedDefinitions,
  primePinnedDefinitionsFromState,
  summarizeRun,
  trimEventStoreSafely,
  type AppendableEvent,
  type AppendResult,
  type ComposedRegistry,
  type DefinitionResolveError,
  type DefinitionResolver,
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
import { stripSeq, type RunCursorCache } from './helpers'
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

const MAX_COMMIT_CONFLICTS = 16

export interface CommitPlan<A> {
  readonly events: ReadonlyArray<EventEnvelope>
  readonly value: A
  readonly idempotencyKey?: string | undefined
}

export interface CommitResult<A> {
  readonly value: A
  /** The durable state the committed batch was planned against. */
  readonly cursor: RunCursor
  /** `null` when the plan had nothing to append. */
  readonly append: AppendResult | null
}

/**
 * Events folded per read while a log is replayed. A replay holds one page at a time, so its
 * memory does not grow with the length of the log on a host with an isolate memory limit.
 */
const REPLAY_PAGE_SIZE = 64

type ReplayError =
  | EventStoreTruncationError
  | EventStoreTrimmedError
  | EventStoreError
  | DefinitionResolveError

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
  readonly definitionResolver: DefinitionResolver
}

export function createRuntimeRepository(options: RuntimeRepositoryOptions) {
  const {
    registry,
    snapshotStore,
    trimAfterSnapshot,
    keepSnapshots,
    runCache,
    executionContexts,
    definitionResolver,
  } = options

  const headerFingerprints = new Map<string, string>()

  const observe = (event: Parameters<RuntimeObserver['observe']>[0]) =>
    notifyObserver(options.observer, event)

  const rememberHeader = (state: RunCursor['state']): Effect.Effect<void> => {
    const header = summarizeRun(state)
    const fingerprint = `${header.status}\0${header.kind ?? ''}\0${header.definitionName ?? ''}`

    if (headerFingerprints.get(header.runId) === fingerprint) {
      return Effect.void
    }

    return snapshotStore.saveHeader(header).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          headerFingerprints.set(header.runId, fingerprint)
        }),
      ),
      Effect.catch((error) =>
        Effect.logWarning(`Run header persistence failed for "${header.runId}"`, error),
      ),
    )
  }

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

  const replay = (
    store: EventStore,
    runId: string,
    cursor: RunCursor,
    window: { readonly throughSeq?: number | undefined; readonly checkGap: boolean },
  ): Effect.Effect<RunCursor, ReplayError> =>
    Effect.gen(function* () {
      let next = cursor
      let first = true

      while (window.throughSeq === undefined || next.seq < window.throughSeq) {
        const fromSeq = next.seq + 1

        const limit =
          window.throughSeq === undefined
            ? REPLAY_PAGE_SIZE
            : Math.min(REPLAY_PAGE_SIZE, window.throughSeq - next.seq)

        const page = yield* store.read(runId, { fromSeq, limit })

        if (page.length === 0) {
          break
        }

        const firstSeq = page[0]!.seq

        if ((first ? window.checkGap : true) && firstSeq > fromSeq) {
          if (store.bounds) {
            const bounds = yield* store.bounds(runId)

            if (bounds.head > fromSeq) {
              return yield* new EventStoreTrimmedError(runId, bounds.head, fromSeq)
            }
          } else {
            return yield* new EventStoreTrimmedError(runId, firstSeq, fromSeq)
          }
        }

        first = false

        const before = next.seq

        yield* primePinnedDefinitions(definitionResolver, page)
        next = advanceCursor(next, page, registry)

        if (next.seq <= before) {
          break
        }

        // A short page can mean the store applied its own batch cap, so confirm the tail
        // before ending the replay.
        if (page.length < limit) {
          const tail = yield* store.tail(runId)

          if (next.seq >= tail) {
            break
          }
        }
      }

      return next
    })

  const catchUp = (
    store: EventStore,
    runId: string,
    cursor: RunCursor,
    expectedTail?: number,
  ): Effect.Effect<RunCursor, ReplayError> =>
    replay(store, runId, cursor, { throughSeq: expectedTail, checkGap: true })

  const loadCursorCold = (
    store: EventStore,
    runId: string,
  ): Effect.Effect<
    RunCursor,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError | DefinitionResolveError
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

          yield* primePinnedDefinitionsFromState(definitionResolver, snap.value.state)
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

      return yield* replay(store, runId, cursor, { checkGap: cursor.seq === 0 })
    })

  const loadCursor = (
    store: EventStore,
    runId: string,
  ): Effect.Effect<
    RunCursor,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError | DefinitionResolveError
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
          yield* rememberHeader(cached.state)
          return cached
        }

        const next = yield* catchUp(store, runId, cached, tail).pipe(
          Effect.catchTag('EventStoreTrimmedError', () => {
            runCache.delete(runId)
            return loadCursorCold(store, runId)
          }),
        )

        runCache.set(runId, next)
        yield* rememberHeader(next.state)
        return next
      }

      const next = yield* loadCursorCold(store, runId)
      runCache.set(runId, next)
      yield* rememberHeader(next.state)
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
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError | DefinitionResolveError
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

      yield* primePinnedDefinitions(definitionResolver, echo)
      next = advanceCursor(next, echo, registry)
      executionContexts.get(runId).liveCount = 0

      if (next.seq !== appendResult.tail) {
        next = yield* catchUp(store, runId, next, appendResult.tail)
      }

      runCache.set(runId, next)
      yield* rememberHeader(next.state)
      return next
    })

  /**
   * Plan a batch against the latest durable state and append it with optimistic concurrency,
   * replanning from fresh state whenever another writer got there first.
   */
  const commit = <A, E, R>(
    store: EventStore,
    runId: string,
    plan: (cursor: RunCursor) => Effect.Effect<CommitPlan<A>, E, R>,
  ): Effect.Effect<
    CommitResult<A>,
    | E
    | RuntimeExecutionError
    | EventStoreAppendError
    | EventStoreTruncationError
    | EventStoreTrimmedError
    | EventStoreError
    | DefinitionResolveError,
    R
  > =>
    Effect.gen(function* () {
      for (let conflicts = 0; conflicts < MAX_COMMIT_CONFLICTS; conflicts += 1) {
        const cursor = yield* loadCursor(store, runId)
        const planned = yield* plan(cursor)

        if (planned.events.length === 0) {
          return { value: planned.value, cursor, append: null }
        }

        const append = yield* appendObserved(store, runId, stripSeq(planned.events), {
          expectedTail: cursor.seq,
          idempotency: planned.idempotencyKey ? { key: planned.idempotencyKey } : undefined,
        }).pipe(
          Effect.asSome,
          Effect.catchTag('EventStoreConflictError', () => Effect.succeedNone),
        )

        if (Option.isSome(append)) {
          return { value: planned.value, cursor, append: append.value }
        }

        runCache.delete(runId)
      }

      return yield* new RuntimeExecutionError(
        `Could not commit to run "${runId}" after ${MAX_COMMIT_CONFLICTS} conflicts`,
      )
    })

  return {
    appendObserved,
    commit,
    liveAppends,
    loadCursor,
    persistSnapshot,
    applyAppend,
    deleteCachedCursor: (runId: string) => runCache.delete(runId),
    setCachedCursor: (runId: string, cursor: RunCursor) => runCache.set(runId, cursor),
  }
}

export type RuntimeRepository = ReturnType<typeof createRuntimeRepository>
