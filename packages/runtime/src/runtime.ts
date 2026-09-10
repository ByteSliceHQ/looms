import { Effect, Layer, Predicate, Schedule } from 'effect'

import {
  asJson,
  buildSnapshotEvent,
  composeModules,
  createEvent,
  createKeyedSerializer,
  createThreadId,
  createRunId,
  EventStoreTag,
  foldFromSnapshots,
  foldRun,
  isPrimitiveEffect,
  isRunTerminal,
  isWaitOnTimer,
  matchingWaits,
  withdrawnError,
  project,
  replayTo,
  shouldTakeSnapshot,
  validateInput,
  type AnyRuntimeModule,
  type AppendableEvent,
  type ComposedRegistry,
  type EffectContext,
  type EventEnvelope,
  type EventInput,
  type EventStore,
  type EventStoreError,
  type JsonValue,
  type ProjectionDefinition,
  type RegisteredDefinition,
  type ReplayStep,
  type RunState,
  type RuntimeEffect,
  type WaitOnTimer,
} from '@looms/core'

export type { RegisteredDefinition } from '@looms/core'

export interface CreateRuntimeOptions<
  TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[],
> {
  readonly modules: TModules
  readonly store?: EventStore
  readonly definitions?: ReadonlyArray<RegisteredDefinition>
  readonly snapshotEvery?: number
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
  wake(runId: string): Effect.Effect<RunState, Error | EventStoreError, EventStoreTag>
  getRun(runId: string): Effect.Effect<RunState, EventStoreError, EventStoreTag>
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
  listRuns(): Effect.Effect<string[], EventStoreError, EventStoreTag>
  rescanTimers(): Effect.Effect<number, EventStoreError, EventStoreTag>
  dispose(): void
}

function stripSeq(events: ReadonlyArray<EventEnvelope>): AppendableEvent[] {
  return events.map(({ seq: _seq, ...rest }) => rest)
}

function moduleServices(
  modules: readonly AnyRuntimeModule[],
  definitions: ReadonlyArray<RegisteredDefinition>,
): Layer.Layer<any, never, never> {
  // SAFETY: Layer.empty has empty requirements and error channel
  let merged: Layer.Layer<any, never, never> = Layer.empty as Layer.Layer<any, never, never>
  for (const module of modules) {
    if (module.services) merged = Layer.merge(merged, module.services({ definitions }))
  }
  return merged
}

function groupOutstanding(items: readonly { threadId: string; causingSeq: number }[]): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const key = `${item.threadId}:${item.causingSeq}`
    if (seen.has(key)) continue
    seen.add(key)
    keys.push(key)
  }
  return keys
}

/**
 * Every `runtime.thread.started` in the log goes through this helper so
 * definition input is validated and Standard Schema defaults are applied.
 * A future third producer of thread.started must call this; do not emit the
 * event with raw input.
 */
function threadStartedEvents(
  definitions: ReadonlyMap<string, RegisteredDefinition>,
  args: {
    kind: string
    definitionName: string
    input: JsonValue
    threadId: string
    parentThreadId: string | null
  },
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  return Effect.gen(function* () {
    const def = definitions.get(`${args.kind}:${args.definitionName}`)
    const raw = args.input ?? null
    let startedInput = raw
    let validationError: string | undefined
    if (def?.input) {
      const validated = yield* Effect.tryPromise({
        try: () => {
          // SAFETY: RegisteredDefinition.input is a Standard Schema when present.
          return validateInput(def.input as never, raw)
        },
        catch: (err) => (err instanceof Error ? err : new Error(String(err))),
      }).pipe(
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
      )
      if (validated.ok) {
        startedInput = validated.value
      } else {
        validationError = validated.error
      }
    }
    const started: EventInput = {
      type: 'runtime.thread.started',
      payload: {
        threadId: args.threadId,
        kind: args.kind,
        definitionName: args.definitionName,
        input: startedInput,
        parentThreadId: args.parentThreadId,
      },
      threadId: args.threadId,
      parentThreadId: args.parentThreadId,
    }
    if (!validationError) return [started]
    return [
      started,
      {
        type: 'runtime.thread.failed',
        payload: { threadId: args.threadId, error: validationError },
        threadId: args.threadId,
      },
    ]
  })
}

function synthesizedThreadFailed(
  before: RunState,
  after: RunState,
  written: readonly EventEnvelope[],
): EventInput[] {
  const out: EventInput[] = []
  for (const [threadId, thread] of Object.entries(after.threads)) {
    if (thread.status !== 'failed') continue
    const prev = before.threads[threadId]
    if (prev?.status === 'failed') continue
    const already = written.some((event) => {
      if (event.type !== 'runtime.thread.failed') return false
      if (event.threadId === threadId) return true
      return Predicate.isObject(event.payload) && event.payload.threadId === threadId
    })
    if (already) continue
    out.push({
      type: 'runtime.thread.failed',
      payload: { threadId, error: thread.error ?? 'failed' },
      threadId,
    })
  }
  return out
}

function waitSatisfiedEvents(state: RunState, events: readonly EventEnvelope[]): EventInput[] {
  const produced: EventInput[] = []
  const remaining = { ...state.waits }
  for (const event of events) {
    if (event.ephemeral || event.type === 'runtime.wait.satisfied') continue
    const matches = matchingWaits(event, Object.values(remaining))
    for (const record of matches) {
      produced.push({
        type: 'runtime.wait.satisfied',
        payload: asJson({
          waitId: record.waitId,
          tag: record.tag ?? null,
          event: { id: event.id, type: event.type, payload: event.payload },
        }),
        threadId: record.threadId,
        causationId: event.id,
      })
      delete remaining[record.waitId]
    }
  }
  return produced
}

export function createRuntime<const TModules extends readonly AnyRuntimeModule[]>(
  options: CreateRuntimeOptions<TModules>,
): LoomsRuntime<TModules> {
  const registry = composeModules(options.modules)
  const registeredDefinitions = options.definitions ?? []
  const definitions = new Map(
    registeredDefinitions.map((def) => [`${def.kind}:${def.name}`, def] as const),
  )
  const services = moduleServices(options.modules, registeredDefinitions)
  const waking = new Set<string>()
  const snapshotEvery = options.snapshotEvery
  const liveAppends = createKeyedSerializer()
  const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>()

  const clearScheduledTimer = (runId: string) => {
    const existing = scheduledTimers.get(runId)
    if (existing) {
      clearTimeout(existing)
      scheduledTimers.delete(runId)
    }
  }

  const scheduleTimerWake = (runId: string, timerAt: number) => {
    clearScheduledTimer(runId)
    const delay = Math.max(0, timerAt - Date.now() + 5)
    const handle = setTimeout(() => {
      scheduledTimers.delete(runId)
      if (options.store) {
        Effect.runPromise(
          Effect.provideService(runtime.wake(runId), EventStoreTag, options.store),
        ).catch((err) => {
          console.error('[timer wake error]', err)
        })
      }
    }, delay)
    scheduledTimers.set(runId, handle)
  }

  const runtime: LoomsRuntime<TModules> = {
    modules: options.modules,
    registry,

    listRuns: () =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        return yield* store.listRuns()
      }),

    getEvents: (runId, readOptions) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        return yield* store.read(runId, readOptions)
      }),

    getRun: (runId) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const events = yield* store.read(runId)
        return foldFromSnapshots(events, registry, { runId })
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

    rescanTimers: () =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const runIds = yield* store.listRuns()
        let count = 0
        for (const runId of runIds) {
          const runState = yield* runtime.getRun(runId)
          if (isRunTerminal(runState)) continue
          let earliestTimerAt: number | null = null
          for (const waitRecord of Object.values(runState.waits)) {
            if (isWaitOnTimer(waitRecord.on)) {
              if (earliestTimerAt === null || waitRecord.on.timerAt < earliestTimerAt) {
                earliestTimerAt = waitRecord.on.timerAt
              }
            }
          }
          if (earliestTimerAt !== null) {
            scheduleTimerWake(runId, earliestTimerAt)
            count += 1
          }
        }
        return count
      }),

    startRun: (args) =>
      Effect.gen(function* () {
        if (!definitions.get(`${args.kind}:${args.definitionName}`)) {
          return yield* Effect.fail(
            new Error(`Unknown definition ${args.kind}:${args.definitionName}`),
          )
        }
        const store = yield* EventStoreTag
        const runId = args.runId ?? createRunId()

        // Idempotency check if run already has events
        const existingEvents = yield* store.read(runId)
        if (existingEvents.length > 0) {
          const existingState = foldFromSnapshots(existingEvents, registry, { runId })
          if (
            (args.idempotencyKey &&
              existingState.processedIdempotencyKeys?.includes(args.idempotencyKey)) ||
            existingState.rootThreadId
          ) {
            return {
              runId,
              threadId: existingState.rootThreadId ?? '',
              state: existingState,
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
        const batch = [
          createEvent(runId, {
            type: 'runtime.run.started',
            payload: {
              rootThreadId: threadId,
              kind: args.kind,
              definitionName: args.definitionName,
              input: startedInput,
            },
            threadId: null,
            origin: { type: 'system' },
            idempotencyKey: args.idempotencyKey,
          }),
          ...startedEvents.map((input) =>
            createEvent(runId, {
              ...input,
              origin: { type: 'system' },
            }),
          ),
        ]
        yield* store.append(runId, stripSeq(batch))
        const state = yield* runtime.wake(runId)
        return { runId, threadId, state }
      }),

    signal: (runId, events, signalOpts) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const currentEvents = yield* store.read(runId)
        const currentState = foldFromSnapshots(currentEvents, registry, { runId })

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

        const batch = filteredEvents.map((input) =>
          createEvent(runId, {
            ...input,
            origin: input.origin ?? { type: 'external' },
            idempotencyKey: input.idempotencyKey ?? signalOpts?.idempotencyKey,
          }),
        )
        const folded = foldRun(batch, registry, { runId, initial: currentState })
        const satisfied = waitSatisfiedEvents(folded, batch)
        const satisfiedEvents = satisfied.map((input) => createEvent(runId, input))
        yield* store.append(runId, stripSeq([...batch, ...satisfiedEvents]))
        return yield* runtime.wake(runId)
      }),

    cancel: (runId, threadId) =>
      runtime.signal(runId, [
        {
          type: 'runtime.thread.cancelled',
          payload: { threadId: threadId ?? '', reason: 'cancelled' },
          threadId: threadId ?? null,
          origin: { type: 'external' },
        },
      ]),

    wake: (runId) =>
      Effect.gen(function* () {
        if (waking.has(runId)) {
          return yield* runtime.getRun(runId)
        }
        waking.add(runId)
        try {
          const store = yield* EventStoreTag
          let events = yield* store.read(runId)
          let state = foldFromSnapshots(events, registry, { runId })
          let guard = 0

          while (!isRunTerminal(state) && guard < 100) {
            guard += 1

            const now = Date.now()
            const due = Object.values(state.waits).filter(
              (record) => isWaitOnTimer(record.on) && record.on.timerAt <= now + 5,
            )
            if (due.length > 0) {
              const batch: EventEnvelope[] = []
              for (const record of due) {
                if (!isWaitOnTimer(record.on)) continue
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
              yield* store.append(runId, stripSeq(fullTimerBatch))
              events = yield* store.read(runId)
              state = foldFromSnapshots(events, registry, { runId })
              continue
            }

            const outstanding = state.outstandingEffects
            if (outstanding.length === 0) break

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
                        createEvent(runId, {
                          type: 'runtime.effect.failed',
                          payload: {
                            effectId: item.effectId,
                            error: withdrawnError(failedEffectId),
                          },
                          threadId: item.threadId,
                          effectId: item.effectId,
                          causationId: item.causingEventId,
                          origin: { type: 'system' },
                        }),
                      )
                      continue
                    }
                    const appendLive = (input: EventInput) => {
                      const targetThreadId = input.threadId ?? item.threadId
                      const ephemeral = createEvent(runId, {
                        ...input,
                        effectId: item.effectId,
                        causationId: item.causingEventId,
                        threadId: targetThreadId,
                        ephemeral: input.ephemeral ?? true,
                        origin: input.origin ?? { type: 'thread', threadId: item.threadId },
                      })
                      return liveAppends.run(runId, () =>
                        Effect.runPromise(store.append(runId, stripSeq([ephemeral]))).then(
                          () => undefined,
                        ),
                      )
                    }
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
                        emit: appendLive,
                      },
                    )
                    const before = groupProduced.length
                    if (outcomes.length === 0) {
                      groupProduced.push(
                        createEvent(runId, {
                          type: 'runtime.effect.failed',
                          payload: { effectId: item.effectId, error: 'empty-outcome' },
                          threadId: item.threadId,
                          effectId: item.effectId,
                          causationId: item.causingEventId,
                          origin: { type: 'system' },
                        }),
                      )
                    }
                    for (const input of outcomes) {
                      const targetThreadId = input.threadId ?? item.threadId
                      groupProduced.push(
                        createEvent(runId, {
                          ...input,
                          effectId: input.effectId ?? item.effectId,
                          causationId: input.causationId ?? item.causingEventId,
                          threadId: targetThreadId,
                          origin: input.origin ?? { type: 'thread', threadId: item.threadId },
                          id: input.id,
                          ts: input.ts,
                        }),
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

            if (produced.length === 0) break
            yield* Effect.promise(() => liveAppends.drain(runId))
            const beforeFold = state
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

            yield* store.append(runId, stripSeq(fullBatch))
            events = yield* store.read(runId)
            state = foldFromSnapshots(events, registry, { runId })
          }

          const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
          if (
            root &&
            (root.status === 'completed' ||
              root.status === 'failed' ||
              root.status === 'cancelled') &&
            !isRunTerminal(state)
          ) {
            yield* store.append(runId, [
              createEvent(runId, {
                type: 'runtime.run.completed',
                payload: {
                  output: root.output,
                  error: root.error,
                },
                threadId: null,
                origin: { type: 'system' },
              }),
            ])
            events = yield* store.read(runId)
            state = foldFromSnapshots(events, registry, { runId })
          }

          if (shouldTakeSnapshot(events, snapshotEvery)) {
            const snap = buildSnapshotEvent(runId, events, registry, { includeState: true })
            yield* store.append(runId, stripSeq([snap]))
            events = yield* store.read(runId)
            state = foldFromSnapshots(events, registry, { runId })
          }

          const pendingTimers = Object.values(state.waits).filter(
            (record) => isWaitOnTimer(record.on) && record.on.timerAt > Date.now(),
          )
          if (pendingTimers.length > 0 && !isRunTerminal(state)) {
            // SAFETY: pendingTimers elements are already filtered with isWaitOnTimer(record.on)
            const earliestTimerAt = Math.min(
              ...pendingTimers.map((r) => (r.on as WaitOnTimer).timerAt),
            )
            scheduleTimerWake(runId, earliestTimerAt)
          } else {
            clearScheduledTimer(runId)
          }

          return state
        } finally {
          waking.delete(runId)
          liveAppends.clear(runId)
        }
      }),

    dispose: () => {
      for (const handle of scheduledTimers.values()) {
        clearTimeout(handle)
      }
      scheduledTimers.clear()
    },
  }

  return runtime
}

function dispatchEffect(
  registry: ComposedRegistry,
  services: Layer.Layer<any, never, never>,
  definitions: ReadonlyMap<string, RegisteredDefinition>,
  effect: RuntimeEffect,
  ctx: EffectContext,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  const currentThreadId = ctx.threadId

  const baseDispatch = (
    eff: RuntimeEffect,
    effCtx: EffectContext,
  ): Effect.Effect<ReadonlyArray<EventInput>, Error> => {
    if (isPrimitiveEffect(eff)) {
      switch (eff.type) {
        case 'runtime.spawn': {
          const childThreadId = eff.childThreadId ?? ''
          return threadStartedEvents(definitions, {
            kind: eff.kind,
            definitionName: eff.definitionName,
            input: eff.input,
            threadId: childThreadId,
            parentThreadId: currentThreadId,
          })
        }
        case 'runtime.wait': {
          const events: EventInput[] = [
            {
              type: 'runtime.wait.registered',
              payload: asJson({
                waitId: eff.waitId,
                threadId: currentThreadId,
                on: eff.on,
                tag: eff.tag ?? null,
              }),
              threadId: currentThreadId,
            },
          ]
          if (isWaitOnTimer(eff.on)) {
            events.push({
              type: 'runtime.timer.set',
              payload: { timerId: eff.waitId, waitId: eff.waitId, wakeAt: eff.on.timerAt },
              threadId: currentThreadId,
            })
          }
          return Effect.succeed(events)
        }
        case 'runtime.emit':
          return Effect.succeed([eff.event])
        case 'runtime.complete':
          return Effect.succeed([
            {
              type: 'runtime.thread.completed',
              payload: { threadId: currentThreadId, output: eff.output },
              threadId: currentThreadId,
            },
          ])
        case 'runtime.fail':
          return Effect.succeed([
            {
              type: 'runtime.thread.failed',
              payload: { threadId: currentThreadId, error: eff.error },
              threadId: currentThreadId,
            },
          ])
        case 'runtime.cancel': {
          const targetThreadId = eff.threadId ?? ''
          return Effect.succeed([
            {
              type: 'runtime.thread.cancelled',
              payload: { threadId: targetThreadId, reason: 'cancelled' },
              threadId: targetThreadId,
            },
          ])
        }
        default: {
          const exhaustiveCheck: never = eff
          return exhaustiveCheck
        }
      }
    }

    const handler = registry.effects.get(eff.type)
    if (!handler) {
      return Effect.succeed([
        {
          type: 'runtime.effect.failed',
          payload: { effectId: effCtx.effectId, error: `No handler for ${eff.type}` },
          threadId: currentThreadId,
        },
      ])
    }
    const input = 'input' in eff ? eff.input : {}
    let execution: Effect.Effect<ReadonlyArray<EventInput>, Error> = handler
      .execute(input, effCtx)
      .pipe(Effect.provide(services))

    if (handler.retry && handler.retry.maxAttempts > 1) {
      const retryPolicy = handler.retry
      const backoff = retryPolicy.backoffMs ?? 100
      execution = execution.pipe(
        Effect.retry({
          times: retryPolicy.maxAttempts - 1,
          schedule: Schedule.spaced(backoff),
        }),
      )
    }

    return execution.pipe(
      Effect.catch((err) =>
        Effect.succeed([
          {
            type: 'runtime.effect.failed',
            payload: {
              effectId: effCtx.effectId,
              error: err instanceof Error ? err.message : String(err),
            },
            threadId: currentThreadId,
          },
        ]),
      ),
    )
  }

  if (registry.middleware && registry.middleware.length > 0) {
    const pipeline = registry.middleware.reduceRight<
      (e: RuntimeEffect, c: EffectContext) => Effect.Effect<ReadonlyArray<EventInput>, Error>
    >((next, mw) => (e, c) => mw(e, c, next), baseDispatch)
    return pipeline(effect, ctx)
  }

  return baseDispatch(effect, ctx)
}
