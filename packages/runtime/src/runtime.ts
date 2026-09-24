import { Clock, Data, Effect, ManagedRuntime, Option, Predicate } from 'effect'

import type {
  EventStoreAppendError,
  EventStoreError,
  EventStoreFencedError,
  EventStoreTruncationError,
} from '@looms/core'
import {
  advanceCursor,
  assignSequences,
  composeModules,
  createCoalescingAppender,
  createEvent,
  createThreadId,
  createRunId,
  DEFAULT_SNAPSHOT_EVERY,
  emptyCursor,
  EventStoreTag,
  EventStoreTrimmedError,
  foldRun,
  hashRunState,
  isRunTerminal,
  isWaitOnTimer,
  project,
  replayTo,
  validateEventInput,
  withdrawnError,
  type AnyRuntimeModule,
  type AppendableEvent,
  type AppendResult,
  type ComposedRegistry,
  type EventEnvelope,
  type EventInput,
  type EventStore,
  type JsonValue,
  type ProjectionDefinition,
  type ReplayStep,
  type RunCursor,
  type RunState,
  type SnapshotStore,
} from '@looms/core'

import { dispatchEffect } from './dispatch-effect'
import {
  createEffectFailedEvent,
  createLiveEvent,
  groupOutstanding,
  materializeEffectOutcome,
  moduleServices,
  resolveSnapshotStore,
  RunCursorCache,
  stripSeq,
  synthesizedThreadFailed,
  threadStartedEvents,
  UnknownDefinitionError,
  validateAndCreateEvents,
  waitSatisfiedEvents,
} from './runtime-helpers'
import { createTimeoutScheduler, type WakeScheduler } from './wake-scheduler'

export type { RegisteredDefinition } from '@looms/core'
export type { WakeScheduler } from './wake-scheduler'
export { createTimeoutScheduler } from './wake-scheduler'

export class DuplicateEffectDispatchError extends Data.TaggedError('DuplicateEffectDispatchError')<{
  readonly runId: string
  readonly effectId: string
  readonly threadId: string
  readonly message: string
}> {
  constructor(runId: string, effectId: string, threadId: string) {
    super({
      runId,
      effectId,
      threadId,
      message: `Duplicate effect dispatch detected for effectId "${effectId}" on thread "${threadId}"; refusing to re-dispatch already executed effect`,
    })

    this.name = 'DuplicateEffectDispatchError'
  }
}

export class MaxWakeIterationsError extends Data.TaggedError('MaxWakeIterationsError')<{
  readonly runId: string
  readonly maxIterations: number
  readonly message: string
}> {
  constructor(runId: string, maxIterations: number) {
    super({
      runId,
      maxIterations,
      message: `Max wake iterations exceeded (${maxIterations}) for run "${runId}"; possible infinite loop`,
    })

    this.name = 'MaxWakeIterationsError'
  }
}

class LiveAppendError extends Data.TaggedError('LiveAppendError')<{
  readonly message: string
}> {
  constructor() {
    super({ message: 'Cannot append live events without a store' })
    this.name = 'LiveAppendError'
  }
}

export type WakeError =
  | DuplicateEffectDispatchError
  | MaxWakeIterationsError
  | EventStoreTruncationError
  | EventStoreTrimmedError
  | EventStoreFencedError
  | EventStoreError
  | Error

export interface CreateRuntimeOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly modules: TModules
  readonly store?: EventStore
  /**
   * Durable events between mid-wake snapshots. Default 200; `0` disables.
   * A snapshot is always taken when a wake parks, so this only bounds replay
   * after a crash inside one long wake.
   */
  readonly snapshotEvery?: number
  readonly maxWakeIterations?: number
  /** Defaults to the EventStore's attached store or an in-memory SnapshotStore. */
  readonly snapshotStore?: SnapshotStore
  /** Trim the event log behind the oldest kept snapshot. Also sets how many snapshots to keep. */
  readonly trimAfterSnapshot?: { keepSnapshots: number }
  /**
   * Cursors to keep in process between calls. Default `0`: every call starts
   * from the store (snapshot + delta). A cached cursor is validated against
   * `store.tail` before use.
   */
  readonly runCacheSize?: number
  /**
   * Pluggable wake scheduler for timer waits.
   * Defaults to an in-process Effect fiber scheduler.
   */
  readonly scheduler?: WakeScheduler
}

export interface StartRunArgs {
  kind: string
  definitionName: string
  input?: JsonValue
  runId?: string
  threadId?: string
  idempotencyKey?: string
}

export interface StartResult {
  runId: string
  threadId: string
  state: RunState
}

export interface LoomsRuntime<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly modules: TModules
  readonly registry: ComposedRegistry
  startRun(args: StartRunArgs): Effect.Effect<StartResult, Error | EventStoreError, EventStoreTag>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
    options?: { idempotencyKey?: string },
  ): Effect.Effect<RunState, Error | EventStoreError, EventStoreTag>
  wake(runId: string): Effect.Effect<RunState, WakeError, EventStoreTag>
  getRun(
    runId: string,
  ): Effect.Effect<
    RunState,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError,
    EventStoreTag
  >
  getEvents(
    runId: string,
    options?: { fromSeq?: number; limit?: number },
  ): Effect.Effect<EventEnvelope[], EventStoreError, EventStoreTag>
  project<S>(
    runId: string,
    definition: ProjectionDefinition<S>,
  ): Effect.Effect<S, EventStoreError, EventStoreTag>
  replayTo(
    runId: string,
    seq: number,
  ): Effect.Effect<ReplayStep | null, EventStoreError, EventStoreTag>
  cancel(
    runId: string,
    threadId?: string,
  ): Effect.Effect<RunState, Error | EventStoreError, EventStoreTag>
  readonly listRuns: Effect.Effect<string[], EventStoreError, EventStoreTag>
  readonly rescanTimers: Effect.Effect<
    number,
    EventStoreTruncationError | EventStoreTrimmedError | EventStoreError,
    EventStoreTag
  >
  readonly dispose: Effect.Effect<void>
}

const DEFAULT_RUN_CACHE_SIZE = 0
const DEFAULT_KEEP_SNAPSHOTS = 1
const NEVER_ABORTED = new AbortController().signal

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

export function createRuntime<const TModules extends readonly AnyRuntimeModule[]>(
  options: CreateRuntimeOptions<TModules>,
): LoomsRuntime<TModules> {
  const registry = composeModules(options.modules)
  const registeredDefinitions = registry.definitions

  const definitions = new Map(
    registeredDefinitions.map((def) => [`${def.kind}:${def.name}`, def] as const),
  )

  // Module composition erases the heterogeneous service identifier union at this host boundary.
  // oxlint-disable-next-line effecttsgo/any-unknown-in-error-context
  const services = ManagedRuntime.make(moduleServices(options.modules))
  const waking = new Set<string>()
  /** Coalesce wake requests that arrive while a wake is in flight for the same run. */
  const wakeAgain = new Set<string>()
  const snapshotEvery = options.snapshotEvery ?? DEFAULT_SNAPSHOT_EVERY
  const maxWakeIterations = options.maxWakeIterations ?? 100
  const snapshotStore = resolveSnapshotStore(options.snapshotStore, options.store)
  const trimAfterSnapshot = options.trimAfterSnapshot
  const keepSnapshots = trimAfterSnapshot?.keepSnapshots ?? DEFAULT_KEEP_SNAPSHOTS
  const runCache = new RunCursorCache(options.runCacheSize ?? DEFAULT_RUN_CACHE_SIZE)
  let liveStore = options.store
  const liveCount = new Map<string, number>()

  const liveAppends = createCoalescingAppender<
    AppendableEvent,
    EventStoreAppendError | LiveAppendError
  >((runId, batch) => {
    const store = liveStore

    if (!store) {
      return Effect.fail(new LiveAppendError())
    }

    return store.append(runId, batch).pipe(
      Effect.tap((result) =>
        Effect.sync(() => {
          liveCount.set(runId, (liveCount.get(runId) ?? 0) + result.sequences.length)
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
        const snap = yield* snapshotStore.loadLatest(runId).pipe(
          Effect.tapError((error) =>
            Effect.logWarning(`Snapshot load failed for run "${runId}"; replaying the log`, error),
          ),
          Effect.orElseSucceed(() => Option.none()),
        )

        if (Option.isSome(snap)) {
          cursor = {
            state: snap.value.state,
            seq: snap.value.cursor,
            durableSinceSnapshot: 0,
          }
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

      yield* snapshotStore.save({
        runId,
        cursor: cursor.seq,
        stateHash: hashRunState(cursor.state),
        takenAt,
        state: cursor.state,
      })

      if (snapshotStore.prune) {
        yield* snapshotStore.prune(runId, keepSnapshots)
      }

      if (trimAfterSnapshot && store.trim && snapshotStore.listCursors) {
        const cursors = yield* snapshotStore.listCursors(runId)
        const oldestKept = cursors[Math.max(0, cursors.length - keepSnapshots)]

        if (oldestKept !== undefined) {
          yield* store.trim(runId, oldestKept + 1)
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
        const live = liveCount.get(runId) ?? 0

        if (live === gap) {
          next = { ...cursor, seq: first.seq - 1 }
        } else {
          next = yield* catchUp(store, runId, cursor, first.seq - 1)
        }
      }

      next = advanceCursor(next, echo, registry)
      liveCount.set(runId, 0)

      if (next.seq !== appendResult.tail) {
        next = yield* catchUp(store, runId, next, appendResult.tail)
      }

      runCache.set(runId, next)
      return next
    })

  let scheduler: WakeScheduler

  const runtime: LoomsRuntime<TModules> = {
    modules: options.modules,
    registry,

    listRuns: Effect.gen(function* () {
      const store = yield* EventStoreTag
      return yield* store.listRuns
    }),

    getEvents: (runId, readOptions) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        return yield* store.read(runId, readOptions)
      }),

    getRun: (runId) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const cursor = yield* loadCursor(store, runId)
        return cursor.state
      }),

    project: (runId, definition) =>
      Effect.gen(function* () {
        const events = yield* runtime.getEvents(runId)
        return project(definition, events)
      }),

    replayTo: (runId, seq) =>
      Effect.gen(function* () {
        const events = yield* runtime.getEvents(runId)
        return replayTo(events, registry, seq)
      }),

    rescanTimers: Effect.gen(function* () {
      const store = yield* EventStoreTag
      const runIds = yield* store.listRuns
      let count = 0

      for (const runId of runIds) {
        const runState = yield* runtime.getRun(runId)

        if (isRunTerminal(runState)) {
          continue
        }

        let earliestTimerAt: number | null = null

        for (const waitRecord of Object.values(runState.waits)) {
          if (isWaitOnTimer(waitRecord.on)) {
            if (earliestTimerAt === null || waitRecord.on.timerAt < earliestTimerAt) {
              earliestTimerAt = waitRecord.on.timerAt
            }
          }
        }

        if (earliestTimerAt !== null) {
          yield* scheduler.schedule(runId, earliestTimerAt)
          count += 1
        }
      }

      return count
    }),

    startRun: (args) =>
      Effect.gen(function* () {
        if (!definitions.get(`${args.kind}:${args.definitionName}`)) {
          return yield* new UnknownDefinitionError(args.kind, args.definitionName)
        }

        const store = yield* EventStoreTag
        const runId = args.runId ?? createRunId()

        const existing = yield* loadCursor(store, runId)

        if (existing.seq > 0) {
          if (
            (args.idempotencyKey &&
              existing.state.processedIdempotencyKeys?.includes(args.idempotencyKey)) ||
            existing.state.rootThreadId
          ) {
            return {
              runId,
              threadId: existing.state.rootThreadId ?? '',
              state: existing.state,
            }
          }
        }

        const threadId = args.threadId ?? createThreadId()

        const startedEvents = yield* threadStartedEvents(definitions, {
          kind: args.kind,
          definitionName: args.definitionName,
          input: args.input ?? null,
          threadId,
          parentThreadId: null,
        })

        const started = startedEvents[0]

        const startedInput =
          started && Predicate.isObject(started.payload)
            ? (started.payload.input ?? null)
            : (args.input ?? null)

        const batch = yield* validateAndCreateEvents(
          registry.catalogs,
          runId,
          [
            {
              type: 'runtime.run.started',
              payload: {
                rootThreadId: threadId,
                kind: args.kind,
                definitionName: args.definitionName,
                input: startedInput,
              },
              threadId: null,
              idempotencyKey: args.idempotencyKey,
            },
            ...startedEvents,
          ],
          { origin: { type: 'system' } },
        )

        yield* store.append(runId, stripSeq(batch))
        const state = yield* runtime.wake(runId)
        return { runId, threadId, state }
      }),

    signal: (runId, events, signalOpts) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const current = yield* loadCursor(store, runId)
        const currentState = current.state

        if (
          signalOpts?.idempotencyKey &&
          currentState.processedIdempotencyKeys?.includes(signalOpts.idempotencyKey)
        ) {
          return currentState
        }

        const filteredEvents = events.filter((input) => {
          const key = input.idempotencyKey ?? signalOpts?.idempotencyKey
          return !key || !currentState.processedIdempotencyKeys?.includes(key)
        })

        if (filteredEvents.length === 0) {
          return currentState
        }

        const batch = yield* validateAndCreateEvents(
          registry.catalogs,
          runId,
          filteredEvents.map((input) => ({
            ...input,
            idempotencyKey: input.idempotencyKey ?? signalOpts?.idempotencyKey,
          })),
          { origin: { type: 'external' } },
        )

        const folded = foldRun(batch, registry, { runId, initial: currentState })
        const satisfied = waitSatisfiedEvents(folded, batch)
        const satisfiedEvents = satisfied.map((input) => createEvent(runId, input))
        yield* store.append(runId, stripSeq([...batch, ...satisfiedEvents]))
        return yield* runtime.wake(runId)
      }),

    cancel: (runId, threadId) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag

        const targetThreadId =
          threadId ?? (yield* loadCursor(store, runId)).state.rootThreadId ?? ''

        return yield* runtime.signal(runId, [
          {
            type: 'runtime.thread.cancelled',
            payload: { threadId: targetThreadId, reason: 'cancelled' },
            threadId: targetThreadId || null,
            origin: { type: 'external' },
          },
        ])
      }),

    wake: (runId) =>
      Effect.gen(function* () {
        // Claim synchronously before any yield so concurrent fibers cannot both pass.
        if (waking.has(runId)) {
          wakeAgain.add(runId)
          return yield* runtime.getRun(runId)
        }

        waking.add(runId)

        const store = yield* EventStoreTag
        const runInContext = Effect.runPromiseWith(yield* Effect.context())
        liveStore = store

        try {
          let finalState: RunState | undefined

          do {
            let cursor = yield* loadCursor(store, runId)

            if (isRunTerminal(cursor.state)) {
              finalState = cursor.state
              break
            }

            liveCount.set(runId, 0)
            const dispatchedEffectIds = new Set<string>()
            let guard = 0

            while (!isRunTerminal(cursor.state)) {
              if (guard >= maxWakeIterations) {
                return yield* new MaxWakeIterationsError(runId, maxWakeIterations)
              }

              guard += 1
              const state = cursor.state
              const now = yield* Clock.currentTimeMillis

              const due = Object.values(state.waits).filter(
                (record) => isWaitOnTimer(record.on) && record.on.timerAt <= now + 5,
              )

              if (due.length > 0) {
                const batch: EventEnvelope[] = []

                for (const record of due) {
                  if (!isWaitOnTimer(record.on)) {
                    continue
                  }

                  batch.push(
                    createEvent(runId, {
                      type: 'runtime.timer.fired',
                      payload: { timerId: record.waitId, waitId: record.waitId },
                      threadId: record.threadId,
                      origin: { type: 'system' },
                    }),
                  )
                }

                const stateAfterFired = foldRun(batch, registry, { runId, initial: state })
                const satisfied = waitSatisfiedEvents(stateAfterFired, batch)
                const satisfiedEvents = satisfied.map((input) => createEvent(runId, input))
                const fullTimerBatch = [...batch, ...satisfiedEvents]
                const appendResult = yield* store.append(runId, stripSeq(fullTimerBatch))

                cursor = yield* applyAppend(
                  store,
                  runId,
                  cursor,
                  stripSeq(fullTimerBatch),
                  appendResult,
                )

                continue
              }

              const outstanding = state.outstandingEffects

              if (outstanding.length === 0) {
                break
              }

              for (const item of outstanding) {
                if (dispatchedEffectIds.has(item.effectId)) {
                  return yield* new DuplicateEffectDispatchError(
                    runId,
                    item.effectId,
                    item.threadId,
                  )
                }
              }

              for (const item of outstanding) {
                dispatchedEffectIds.add(item.effectId)
              }

              const groupKeys = groupOutstanding(outstanding)

              const groupResults = yield* Effect.forEach(
                groupKeys,
                (groupKey) =>
                  Effect.gen(function* () {
                    const group = outstanding.filter(
                      (item) => `${item.threadId}:${item.causingSeq}` === groupKey,
                    )

                    const groupProduced: EventEnvelope[] = []
                    let failedEffectId: string | undefined

                    for (const item of group) {
                      if (failedEffectId && item.effect.type === 'runtime.wait') {
                        groupProduced.push(
                          createEffectFailedEvent(runId, item, withdrawnError(failedEffectId)),
                        )

                        continue
                      }

                      const appendLive = (input: EventInput) =>
                        runInContext(
                          Effect.gen(function* () {
                            const validated = yield* validateEventInput(registry.catalogs, input)
                            const liveEvent = createLiveEvent(runId, item, validated)

                            if (liveEvent) {
                              yield* liveAppends.push(runId, liveEvent)
                            }
                          }),
                        )

                      const outcomes = yield* dispatchEffect(
                        registry,
                        services,
                        definitions,
                        item.effect,
                        {
                          effectId: item.effectId,
                          runId,
                          threadId: item.threadId,
                          causingEventId: item.causingEventId,
                          signal: NEVER_ABORTED,
                          emit: appendLive,
                        },
                      )

                      const before = groupProduced.length

                      if (outcomes.length === 0) {
                        groupProduced.push(createEffectFailedEvent(runId, item, 'empty-outcome'))
                      }

                      for (const input of outcomes) {
                        groupProduced.push(
                          yield* materializeEffectOutcome(registry.catalogs, runId, item, input),
                        )
                      }

                      const groupOutcomes = groupProduced.slice(before)

                      if (
                        item.effect.type !== 'runtime.wait' &&
                        groupOutcomes.some((event) => event.type === 'runtime.effect.failed')
                      ) {
                        failedEffectId = item.effectId
                      }
                    }

                    return groupProduced
                  }),
                { concurrency: 'unbounded' },
              )

              const produced = groupResults.flat()

              if (produced.length === 0) {
                break
              }

              yield* liveAppends.drain(runId)
              const beforeFold = cursor.state
              const intermediateState = foldRun(produced, registry, { runId, initial: beforeFold })
              const synthesized = synthesizedThreadFailed(beforeFold, intermediateState, produced)
              const synthesizedEvents = synthesized.map((input) => createEvent(runId, input))

              const stateAfterSynth =
                synthesizedEvents.length > 0
                  ? foldRun(synthesizedEvents, registry, { runId, initial: intermediateState })
                  : intermediateState

              const allNewEvents = [...produced, ...synthesizedEvents]
              const satisfied = waitSatisfiedEvents(stateAfterSynth, allNewEvents)
              const satisfiedEvents = satisfied.map((input) => createEvent(runId, input))
              const fullBatch = [...allNewEvents, ...satisfiedEvents]

              const appendResult = yield* store.append(runId, stripSeq(fullBatch))
              cursor = yield* applyAppend(store, runId, cursor, stripSeq(fullBatch), appendResult)

              // Bound replay after a crash inside a long wake.
              if (snapshotEvery > 0 && cursor.durableSinceSnapshot >= snapshotEvery) {
                cursor = yield* persistSnapshot(store, runId, cursor)
              }
            }

            const root = cursor.state.rootThreadId
              ? cursor.state.threads[cursor.state.rootThreadId]
              : undefined

            if (
              root &&
              (root.status === 'completed' ||
                root.status === 'failed' ||
                root.status === 'cancelled') &&
              !isRunTerminal(cursor.state)
            ) {
              const completed = createEvent(runId, {
                type: 'runtime.run.completed',
                payload: {
                  output: root.output,
                  error: root.error,
                },
                threadId: null,
                origin: { type: 'system' },
              })

              const appendResult = yield* store.append(runId, stripSeq([completed]))
              cursor = yield* applyAppend(store, runId, cursor, stripSeq([completed]), appendResult)
            }

            // Snapshot on park: the next wake (on any instance) starts from here.
            cursor = yield* persistSnapshot(store, runId, cursor)
            const parkedAt = yield* Clock.currentTimeMillis

            const pendingTimerTimes = Object.values(cursor.state.waits).flatMap((record) =>
              isWaitOnTimer(record.on) && record.on.timerAt > parkedAt ? [record.on.timerAt] : [],
            )

            if (pendingTimerTimes.length > 0 && !isRunTerminal(cursor.state)) {
              const earliestTimerAt = Math.min(...pendingTimerTimes)

              yield* scheduler.schedule(runId, earliestTimerAt)
            } else {
              yield* scheduler.cancel(runId)
            }

            if (isRunTerminal(cursor.state)) {
              runCache.delete(runId)
            } else {
              runCache.set(runId, cursor)
            }

            finalState = cursor.state
          } while (wakeAgain.delete(runId))

          // Lost race: a waiter queued after the drain loop but before unlock.
          if (wakeAgain.has(runId)) {
            waking.delete(runId)
            liveAppends.clear(runId)
            liveCount.delete(runId)
            return yield* runtime.wake(runId)
          }

          return finalState
        } finally {
          if (waking.has(runId)) {
            waking.delete(runId)
          }

          liveAppends.clear(runId)
          liveCount.delete(runId)
        }
      }),

    dispose: Effect.sync(() => scheduler.dispose?.()).pipe(Effect.andThen(services.disposeEffect)),
  }

  scheduler =
    options.scheduler ??
    createTimeoutScheduler((runId) =>
      options.store
        ? runtime
            .wake(runId)
            .pipe(
              Effect.provideService(EventStoreTag, options.store),
              Effect.tapError(Effect.logError),
              Effect.ignore,
            )
        : Effect.void,
    )

  return runtime
}
