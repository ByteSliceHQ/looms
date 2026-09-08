import {
  asJson,
  buildSnapshotEvent,
  composeModules,
  createEvent,
  createThreadId,
  createRunId,
  EventStoreTag,
  foldFromSnapshots,
  isPrimitiveEffect,
  isRunParked,
  isRunTerminal,
  isWaitOnTimer,
  matchingWaits,
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
import { Effect, Layer } from 'effect'

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

function bindThreads(modules: readonly AnyRuntimeModule[], state: RunState): void {
  for (const record of Object.values(state.threads)) {
    for (const module of modules) {
      if (module.bindThread) {
        module.bindThread(record)
      }
    }
  }
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

    getEvents: (runId, options) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        return yield* store.read(runId, options)
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
        const def = definitions.get(`${args.kind}:${args.definitionName}`)
        if (!def) {
          return yield* Effect.fail(new Error(`Unknown definition ${args.kind}:${args.definitionName}`))
        }
        const rawInput = args.input ?? null
        const validated = def.input
          ? yield* Effect.tryPromise({
              try: () => {
                // SAFETY: RegisteredDefinition.input is a Standard Schema when present.
                return validateInput(def.input as never, rawInput)
              },
              catch: (err) => (err instanceof Error ? err : new Error(String(err))),
            })
          : rawInput
        const runId = args.runId ?? createRunId()
        const threadId = args.threadId ?? createThreadId()
        const store = yield* EventStoreTag
        const batch = [
          createEvent(runId, {
            type: 'runtime.run.started',
            payload: {
              rootThreadId: threadId,
              kind: args.kind,
              definitionName: args.definitionName,
              input: validated,
            },
            threadId: null,
            origin: { type: 'system' },
          }),
          createEvent(runId, {
            type: 'runtime.thread.started',
            payload: {
              threadId,
              kind: args.kind,
              definitionName: args.definitionName,
              input: validated,
              parentThreadId: null,
            },
            threadId,
            origin: { type: 'system' },
          }),
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
        yield* store.append(runId, stripSeq(batch))
        const folded = foldFromSnapshots(yield* store.read(runId), registry, { runId })
        const satisfied = waitSatisfiedEvents(folded, batch)
        if (satisfied.length > 0) {
          yield* store.append(
            runId,
            satisfied.map((input) => createEvent(runId, input)),
          )
        }
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
            bindThreads(options.modules, state)

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
              yield* store.append(runId, stripSeq(batch))
              const fired = (yield* store.read(runId)).slice(-batch.length)
              const satisfied = waitSatisfiedEvents(state, fired)
              if (satisfied.length > 0) {
                yield* store.append(
                  runId,
                  satisfied.map((input) => createEvent(runId, input)),
                )
              }
              events = yield* store.read(runId)
              state = foldFromSnapshots(events, registry, { runId })
              continue
            }

            const outstanding = state.outstandingEffects
            if (outstanding.length === 0) break

            const produced: EventEnvelope[] = []
            for (const item of outstanding) {
              const outcomes = yield* dispatchEffect(registry, services, item.effect, {
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
              if (outcomes.length === 0) {
                produced.push(
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
                produced.push(
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
            }

            if (produced.length === 0) break
            yield* store.append(runId, stripSeq(produced))
            events = yield* store.read(runId)
            state = foldFromSnapshots(events, registry, { runId })
            const written = events.slice(-produced.length)
            const satisfied = waitSatisfiedEvents(state, written)
            if (satisfied.length > 0) {
              yield* store.append(
                runId,
                satisfied.map((input) => createEvent(runId, input)),
              )
              events = yield* store.read(runId)
              state = foldFromSnapshots(events, registry, { runId })
            }
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
  effect: RuntimeEffect,
  ctx: EffectContext,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  const currentThreadId = ctx.threadId
  
  if (isPrimitiveEffect(effect)) {
    switch (effect.type) {
      case 'runtime.spawn': {
        const childThreadId = effect.childThreadId ?? ''
        return Effect.succeed([
          {
            type: 'runtime.thread.started',
            payload: {
              threadId: childThreadId,
              kind: effect.kind,
              definitionName: effect.definitionName,
              input: effect.input,
              parentThreadId: currentThreadId,
            },
            threadId: childThreadId,
            parentThreadId: currentThreadId,
          },
        ])
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
        const _exhaustive: never = effect
        return _exhaustive
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
