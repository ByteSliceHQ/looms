import {
  asJson,
  buildSnapshotEvent,
  composeModules,
  createEvent,
  createThreadId,
  createRunId,
  EventStoreTag,
  foldFromSnapshots,
  foldRun,
  isPrimitiveEffect,
  isRunParked,
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
} from '@looms/core'
import { Effect, Layer, Predicate } from 'effect'

export type { RegisteredDefinition } from '@looms/core'

export interface CreateRuntimeOptions<TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[]> {
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
}

export interface StartResult {
  runId: string
  threadId: string
  state: RunState
}

export interface LoomsRuntime<TModules extends readonly AnyRuntimeModule[] = readonly AnyRuntimeModule[]> {
  readonly modules: TModules
  readonly registry: ComposedRegistry
  startRun(
    args: StartRunArgs,
  ): Effect.Effect<StartResult, Error | EventStoreError, EventStoreTag>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
  ): Effect.Effect<RunState, Error | EventStoreError, EventStoreTag>
  wake(runId: string): Effect.Effect<RunState, Error | EventStoreError, EventStoreTag>
  getRun(runId: string): Effect.Effect<RunState, EventStoreError, EventStoreTag>
  getEvents(
    runId: string,
    options?: { fromSeq?: number; limit?: number },
  ): Effect.Effect<EventEnvelope[], EventStoreError, EventStoreTag>
  project<S>(runId: string, definition: ProjectionDefinition<S>): Effect.Effect<S, EventStoreError, EventStoreTag>
  replayTo(runId: string, seq: number): Effect.Effect<ReplayStep | null, EventStoreError, EventStoreTag>
  cancel(
    runId: string,
    threadId?: string,
  ): Effect.Effect<RunState, Error | EventStoreError, EventStoreTag>
  listRuns(): Effect.Effect<string[], EventStoreError, EventStoreTag>
}

function stripSeq(events: ReadonlyArray<EventEnvelope>): AppendableEvent[] {
  return events.map(({ seq: _seq, ...rest }) => rest)
}

function moduleServices(
  modules: readonly AnyRuntimeModule[],
  definitions: ReadonlyArray<RegisteredDefinition>,
): Layer.Layer<never, never, never> {
  let merged: Layer.Layer<never, never, never> = Layer.empty
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
  const definitions = new Map(registeredDefinitions.map((def) => [`${def.kind}:${def.name}`, def] as const))
  const services = moduleServices(options.modules, registeredDefinitions)
  const waking = new Set<string>()
  const snapshotEvery = options.snapshotEvery

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

    startRun: (args) =>
      Effect.gen(function* () {
        if (!definitions.get(`${args.kind}:${args.definitionName}`)) {
          return yield* Effect.fail(new Error(`Unknown definition ${args.kind}:${args.definitionName}`))
        }
        const runId = args.runId ?? createRunId()
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
          started && Predicate.isObject(started.payload) ? (started.payload.input ?? null) : (args.input ?? null)
        const store = yield* EventStoreTag
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

    signal: (runId, events) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const batch = events.map((input) =>
          createEvent(runId, {
            ...input,
            origin: input.origin ?? { type: 'external' },
          }),
        )
        const currentEvents = yield* store.read(runId)
        const currentState = foldFromSnapshots(currentEvents, registry, { runId })
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

          while (!isRunTerminal(state) && !isRunParked(state) && guard < 100) {
            guard += 1

            const now = Date.now()
            const due = Object.values(state.waits).filter(
              (record) => isWaitOnTimer(record.on) && record.on.timerAt <= now,
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
                  const group = outstanding.filter((item) => `${item.threadId}:${item.causingSeq}` === groupKey)
                  const groupProduced: EventEnvelope[] = []
                  let failedEffectId: string | undefined
                  for (const item of group) {
                    if (failedEffectId && item.effect.type === 'runtime.wait') {
                      groupProduced.push(
                        createEvent(runId, {
                          type: 'runtime.effect.failed',
                          payload: { effectId: item.effectId, error: withdrawnError(failedEffectId) },
                          threadId: item.threadId,
                          effectId: item.effectId,
                          causationId: item.causingEventId,
                          origin: { type: 'system' },
                        }),
                      )
                      continue
                    }
                    const outcomes = yield* dispatchEffect(registry, services, definitions, item.effect, {
                      effectId: item.effectId,
                      runId,
                      threadId: item.threadId,
                      causingEventId: item.causingEventId,
                      emit: (input) => {
                        const targetThreadId = input.threadId ?? item.threadId
                        const ephemeral = createEvent(runId, {
                          ...input,
                          effectId: item.effectId,
                          causationId: item.causingEventId,
                          threadId: targetThreadId,
                          ephemeral: true,
                          origin: input.origin ?? { type: 'thread', threadId: item.threadId },
                        })
                        void Effect.runPromise(store.append(runId, stripSeq([ephemeral])))
                      },
                    })
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
          if (root && (root.status === 'completed' || root.status === 'failed' || root.status === 'cancelled') && !isRunTerminal(state)) {
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

          return state
        } finally {
          waking.delete(runId)
        }
      }),
  }

  return runtime
}

function dispatchEffect(
  registry: ComposedRegistry,
  services: Layer.Layer<never, never, never>,
  definitions: ReadonlyMap<string, RegisteredDefinition>,
  effect: RuntimeEffect,
  ctx: EffectContext,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  const currentThreadId = ctx.threadId
  
  if (isPrimitiveEffect(effect)) {
    switch (effect.type) {
      case 'runtime.spawn': {
        const childThreadId = effect.childThreadId ?? ''
        return threadStartedEvents(definitions, {
          kind: effect.kind,
          definitionName: effect.definitionName,
          input: effect.input,
          threadId: childThreadId,
          parentThreadId: currentThreadId,
        })
      }
      case 'runtime.wait': {
        const events: EventInput[] = [
          {
            type: 'runtime.wait.registered',
            payload: asJson({
              waitId: effect.waitId,
              threadId: currentThreadId,
              on: effect.on,
              tag: effect.tag ?? null,
            }),
            threadId: currentThreadId,
          },
        ]
        if (isWaitOnTimer(effect.on)) {
          events.push({
            type: 'runtime.timer.set',
            payload: { timerId: effect.waitId, waitId: effect.waitId, wakeAt: effect.on.timerAt },
            threadId: currentThreadId,
          })
        }
        return Effect.succeed(events)
      }
      case 'runtime.emit':
        return Effect.succeed([effect.event])
      case 'runtime.complete':
        return Effect.succeed([
          {
            type: 'runtime.thread.completed',
            payload: { threadId: currentThreadId, output: effect.output },
            threadId: currentThreadId,
          },
        ])
      case 'runtime.fail':
        return Effect.succeed([
          {
            type: 'runtime.thread.failed',
            payload: { threadId: currentThreadId, error: effect.error },
            threadId: currentThreadId,
          },
        ])
      case 'runtime.cancel': {
        const targetThreadId = effect.threadId ?? ''
        return Effect.succeed([
          {
            type: 'runtime.thread.cancelled',
            payload: { threadId: targetThreadId, reason: 'cancelled' },
            threadId: targetThreadId,
          },
        ])
      }
      default: {
        const exhaustiveCheck: never = effect
        return exhaustiveCheck
      }
    }
  }

  const handler = registry.handlers.get(effect.type)
  if (!handler) {
    return Effect.succeed([
      {
        type: 'runtime.effect.failed',
        payload: { effectId: ctx.effectId, error: `No handler for ${effect.type}` },
        threadId: currentThreadId,
      },
    ])
  }
  const input = 'input' in effect ? effect.input : {}
  return handler.execute(input, ctx).pipe(
    Effect.provide(services),
    Effect.catch((err) =>
      Effect.succeed([
        {
          type: 'runtime.effect.failed',
          payload: { effectId: ctx.effectId, error: err instanceof Error ? err.message : String(err) },
          threadId: currentThreadId,
        },
      ]),
    ),
  )
}
