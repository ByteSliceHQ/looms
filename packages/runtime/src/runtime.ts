import { executeAgentTurn, executeToolCall, LlmTag } from '@looms/agent'
import {
  event,
  eventFromSignal,
  EventStoreTag,
  isParked,
  isTerminal,
  reduceActor,
  shouldTakeSnapshot,
  buildSnapshotEvent,
  DEFAULT_SNAPSHOT_EVERY,
  validateDefinitionInput,
  type ActorState,
  type AgentDefinition,
  type AppendableLoomsEvent,
  type EventStore,
  type EventStoreError,
  type JsonValue,
  type Message,
  type OwedWork,
  type ReviewDecidedPayload,
  type LoomsEvent,
  type LoomsEventSignal,
  type WorkflowDefinition,
} from '@looms/core'
import { executeWorkflowNode, scheduleWorkflow } from '@looms/workflow'
import { Effect, Predicate, Schema } from 'effect'
import type { DefinitionRegistry } from './registry'

export interface SpawnRequest {
  childActorId: string
  kind: 'agent' | 'workflow'
  definitionName: string
  definition?: AgentDefinition | WorkflowDefinition
  input: JsonValue
  parentActorId: string
  toolCallId: string | null
  nodeId: string | null
}

export type RuntimeEnv = EventStoreTag | LlmTag

export interface LoomsRuntime {
  readonly registry: DefinitionRegistry
  readonly startAgent: (
    definitionName: string,
    input?: JsonValue,
    options?: { actorId?: string; parentActorId?: string | null },
  ) => Effect.Effect<{ actorId: string; state: ActorState }, Error | EventStoreError, EventStoreTag | LlmTag>
  readonly startWorkflow: (
    definitionName: string,
    input?: JsonValue,
    options?: { actorId?: string; parentActorId?: string | null },
  ) => Effect.Effect<{ actorId: string; state: ActorState }, Error | EventStoreError, EventStoreTag | LlmTag>
  readonly signal: (
    actorId: string,
    events: ReadonlyArray<LoomsEventSignal>,
  ) => Effect.Effect<ActorState, Error | EventStoreError, EventStoreTag | LlmTag>
  readonly wake: (
    actorId: string,
  ) => Effect.Effect<ActorState, Error | EventStoreError, EventStoreTag | LlmTag>
  readonly decideReview: (
    actorId: string,
    reviewId: string,
    decision: { actionId: string; outcome: 'approve' | 'reject'; payload?: JsonValue },
  ) => Effect.Effect<ActorState, Error | EventStoreError, EventStoreTag | LlmTag>
  readonly steer: (
    actorId: string,
    message: string | Message,
    options?: { interrupt?: boolean; turn?: number },
  ) => Effect.Effect<ActorState, Error | EventStoreError, EventStoreTag | LlmTag>
  readonly getState: (
    actorId: string,
  ) => Effect.Effect<ActorState, EventStoreError, EventStoreTag>
  readonly getEvents: (
    actorId: string,
    options?: { fromSeq?: number; limit?: number },
  ) => Effect.Effect<LoomsEvent[], EventStoreError, EventStoreTag>
}

const OptionalStringField = Schema.Struct({
  timerId: Schema.optional(Schema.String),
  nodeId: Schema.optional(Schema.String),
  parentActorId: Schema.optional(Schema.NullOr(Schema.String)),
  childActorId: Schema.optional(Schema.String),
  toolCallId: Schema.optional(Schema.NullOr(Schema.String)),
  childDefinitionName: Schema.optional(Schema.String),
})

function readPayloadFields(
  payload: LoomsEvent['payload'],
): Schema.Schema.Type<typeof OptionalStringField> {
  const decoded = Schema.decodeUnknownExit(OptionalStringField)(payload)
  if (decoded._tag === 'Success') return decoded.value
  return {}
}

function createActorId(kind: 'agent' | 'workflow'): string {
  const prefix = kind === 'agent' ? 'agt' : 'wf'
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function stripSeq(events: ReadonlyArray<LoomsEvent>): AppendableLoomsEvent[] {
  // SAFETY: omitting seq from LoomsEvent yields AppendableLoomsEvent member-wise; TS collapse loses the correlation.
  return events.map(({ seq: _seq, ...rest }) => rest as AppendableLoomsEvent)
}

export function createLoomsRuntime(registry: DefinitionRegistry): LoomsRuntime {
  const waking = new Set<string>()
  const spawnMeta = new Map<
    string,
    { parentActorId: string; toolCallId: string | null; nodeId: string | null }
  >()

  const runtime: LoomsRuntime = {
    registry,
    getState: (actorId) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const events = yield* store.read(actorId)
        return reduceActor(events, { actorId })
      }),

    getEvents: (actorId, options) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        return yield* store.read(actorId, options)
      }),

    startAgent: (definitionName, input = null, options) =>
      Effect.gen(function* () {
        const def = registry.agents.get(definitionName)
        if (!def) return yield* Effect.fail(new Error(`Unknown agent: ${definitionName}`))
        const validatedInput = yield* Effect.tryPromise({
          try: () => validateDefinitionInput(def, input),
          catch: (err) => (err instanceof Error ? err : new Error(String(err))),
        })
        const actorId = options?.actorId ?? createActorId('agent')
        const store = yield* EventStoreTag
        const batch: LoomsEvent[] = [
          event('actor.started', actorId, {
            kind: 'agent' as const,
            definitionName,
            input: validatedInput,
            parentActorId: options?.parentActorId ?? null,
            maxTurns: def.maxTurns ?? 20,
          }),
        ]
        if (validatedInput !== null && validatedInput !== undefined) {
          const content = Predicate.isString(validatedInput)
            ? validatedInput
            : JSON.stringify(validatedInput)
          batch.push(
            event('agent.message.received', actorId, {
              message: { role: 'user', content } satisfies Message,
            }),
          )
        }
        yield* store.append(actorId, stripSeq(batch))
        const state = yield* runtime.wake(actorId)
        return { actorId, state }
      }),

    startWorkflow: (definitionName, input = null, options) =>
      Effect.gen(function* () {
        const def = registry.workflows.get(definitionName)
        if (!def) return yield* Effect.fail(new Error(`Unknown workflow: ${definitionName}`))
        const validatedInput = yield* Effect.tryPromise({
          try: () => validateDefinitionInput(def, input),
          catch: (err) => (err instanceof Error ? err : new Error(String(err))),
        })
        const actorId = options?.actorId ?? createActorId('workflow')
        const store = yield* EventStoreTag
        yield* store.append(
          actorId,
          stripSeq([
            event('actor.started', actorId, {
              kind: 'workflow',
              definitionName,
              input: validatedInput,
              parentActorId: options?.parentActorId ?? null,
              concurrency: def.concurrency ?? 8,
              nodeIds: def.nodes.map((n) => n.id),
            }),
          ]),
        )
        const state = yield* runtime.wake(actorId)
        return { actorId, state }
      }),

    signal: (actorId, events) =>
      Effect.gen(function* () {
        const store = yield* EventStoreTag
        const batch = events.map((e) => eventFromSignal(e, actorId))
        yield* store.append(actorId, stripSeq(batch))
        return yield* runtime.wake(actorId)
      }),

    decideReview: (actorId, reviewId, decision) => {
      const payload = {
        reviewId,
        actionId: decision.actionId,
        outcome: decision.outcome,
      } satisfies ReviewDecidedPayload
      const withOptional: ReviewDecidedPayload =
        decision.payload === undefined
          ? payload
          : { ...payload, payload: decision.payload }
      return runtime.signal(actorId, [
        {
          type: 'review.decided',
          payload: withOptional,
        },
      ])
    },

    steer: (actorId, message, options) =>
      Effect.gen(function* () {
        const state = yield* runtime.getState(actorId)
        const msg: Message = Predicate.isString(message)
          ? { role: 'user', content: message }
          : message
        return yield* runtime.signal(actorId, [
          {
            type: 'agent.turn.steered',
            payload: {
              turn: options?.turn ?? (state.kind === 'agent' ? state.turn : 0),
              message: msg,
              interrupt: options?.interrupt ?? true,
            },
          },
        ])
      }),

    wake: (actorId) =>
      Effect.gen(function* () {
        if (waking.has(actorId)) {
          return yield* runtime.getState(actorId)
        }
        waking.add(actorId)
        try {
          const store = yield* EventStoreTag
          let events = yield* store.read(actorId)
          let state = reduceActor(events, { actorId })
          let guard = 0
          let shouldRewake = false

          while (!isTerminal(state) && !isParked(state) && guard < 100) {
            guard += 1

            const dueTimer = state.owed.find(
              (w): w is Extract<OwedWork, { type: 'timer.wait' }> =>
                w.type === 'timer.wait' && w.wakeAt <= Date.now(),
            )
            if (dueTimer) {
              const timerEvt = events.find((e) => {
                if (e.type !== 'timer.set') return false
                return readPayloadFields(e.payload).timerId === dueTimer.timerId
              })
              const nodeId = timerEvt ? readPayloadFields(timerEvt.payload).nodeId : undefined
              const batch: LoomsEvent[] = [
                event('timer.fired', actorId, { timerId: dueTimer.timerId }),
              ]
              if (nodeId && state.kind === 'workflow') {
                const node = state.nodes[nodeId]
                if (node?.status === 'running' || node?.status === 'waiting_review') {
                  batch.push(
                    event('workflow.node.finished', actorId, {
                      nodeId,
                      result: { waited: true },
                      error: null,
                    }),
                  )
                }
              }
              yield* store.append(actorId, stripSeq(batch))
              events = yield* store.read(actorId)
              state = reduceActor(events, { actorId })
              continue
            }

            const definition =
              state.kind === 'agent'
                ? registry.agents.get(state.definitionName)
                : registry.workflows.get(state.definitionName)
            if (!definition) {
              yield* store.append(
                actorId,
                stripSeq([
                  event('actor.failed', actorId, {
                    error: `Unknown definition: ${state.definitionName}`,
                  }),
                ]),
              )
              events = yield* store.read(actorId)
              state = reduceActor(events, { actorId })
              break
            }

            const actionable = state.owed.find(
              (w) =>
                w.type !== 'review.wait' &&
                w.type !== 'child.wait' &&
                w.type !== 'timer.wait',
            )
            if (!actionable) break

            const { events: produced, spawns } = yield* runOwed(
              registry,
              definition,
              state,
              actionable,
              store,
            )
            if (produced.length === 0) break

            yield* store.append(actorId, produced)
            for (const spawn of spawns) {
              spawnMeta.set(spawn.childActorId, {
                parentActorId: spawn.parentActorId,
                toolCallId: spawn.toolCallId,
                nodeId: spawn.nodeId,
              })
              if (spawn.definition?.kind === 'agent') {
                registry.agents.set(spawn.definition.name, spawn.definition)
              } else if (spawn.definition?.kind === 'workflow') {
                registry.workflows.set(spawn.definition.name, spawn.definition)
              }
              if (spawn.kind === 'agent') {
                yield* runtime.startAgent(spawn.definitionName, spawn.input, {
                  actorId: spawn.childActorId,
                  parentActorId: spawn.parentActorId,
                })
              } else {
                yield* runtime.startWorkflow(spawn.definitionName, spawn.input, {
                  actorId: spawn.childActorId,
                  parentActorId: spawn.parentActorId,
                })
              }
            }

            events = yield* store.read(actorId)
            state = reduceActor(events, { actorId })
          }

          if (isTerminal(state) && state.parentActorId) {
            yield* notifyParent(runtime, spawnMeta, actorId, state.output, state.error)
          }

          events = yield* store.read(actorId)
          if (shouldTakeSnapshot(events, DEFAULT_SNAPSHOT_EVERY)) {
            const snap = buildSnapshotEvent(actorId, events, { includeState: true })
            yield* store.append(actorId, stripSeq([snap]))
            events = yield* store.read(actorId)
            state = reduceActor(events, { actorId })
          }

          shouldRewake =
            guard >= 100 &&
            !isTerminal(state) &&
            !isParked(state) &&
            state.owed.some(
              (w) =>
                w.type !== 'review.wait' &&
                w.type !== 'child.wait' &&
                w.type !== 'timer.wait',
            )

          if (!shouldRewake) return state
        } finally {
          waking.delete(actorId)
        }
        return yield* runtime.wake(actorId)
      }),
  }

  return runtime
}

function notifyParent(
  runtime: LoomsRuntime,
  spawnMeta: Map<string, { parentActorId: string; toolCallId: string | null; nodeId: string | null }>,
  childActorId: string,
  result: JsonValue | null,
  error: string | null,
): Effect.Effect<void, Error | EventStoreError, EventStoreTag | LlmTag> {
  return Effect.gen(function* () {
    const meta = spawnMeta.get(childActorId)
    const store = yield* EventStoreTag
    const childEvents = yield* store.read(childActorId)
    const started = childEvents.find((e) => e.type === 'actor.started')
    const parentActorId =
      meta?.parentActorId ??
      (started ? readPayloadFields(started.payload).parentActorId : undefined) ??
      null
    if (!parentActorId) return

    const parentEvents = yield* store.read(parentActorId)
    const spawnEvt = parentEvents.find((e) => {
      if (e.type !== 'child.spawned') return false
      return readPayloadFields(e.payload).childActorId === childActorId
    })
    const spawnPayload = spawnEvt ? readPayloadFields(spawnEvt.payload) : undefined
    const nodeId = meta?.nodeId ?? spawnPayload?.nodeId ?? null
    const toolCallId = meta?.toolCallId ?? spawnPayload?.toolCallId ?? null

    const batch: LoomsEvent[] = []
    // Agent/workflow-tool: emit tool.result while still waiting_child so we don't
    // double-schedule agent.turn (tool.result only resumes when status is running).
    if (toolCallId) {
      batch.push(
        event('tool.result', parentActorId, {
          turn: null,
          toolCallId,
          name: spawnPayload?.childDefinitionName ?? 'child',
          result,
          error,
        }),
      )
    }
    batch.push(
      event('child.completed', parentActorId, {
        childActorId,
        result,
        error,
      }),
    )
    // Workflow node spawns also need the node marked finished.
    if (nodeId) {
      batch.push(
        event('workflow.node.finished', parentActorId, {
          nodeId,
          result,
          error,
        }),
      )
    }
    yield* store.append(parentActorId, stripSeq(batch))
    spawnMeta.delete(childActorId)
    yield* runtime.wake(parentActorId)
  })
}

function runOwed(
  registry: DefinitionRegistry,
  definition: AgentDefinition | WorkflowDefinition,
  state: ActorState,
  work: OwedWork,
  store: EventStore,
): Effect.Effect<
  {
    events: AppendableLoomsEvent[]
    spawns: SpawnRequest[]
  },
  Error,
  LlmTag
> {
  return Effect.gen(function* () {
    switch (work.type) {
      case 'agent.turn': {
        if (state.kind !== 'agent' || definition.kind !== 'agent') {
          return { events: [], spawns: [] }
        }
        const result = yield* executeAgentTurn(definition, state, {
          emit: async (evt) => {
            await Effect.runPromise(store.append(state.actorId, stripSeq([evt])))
          },
        })
        return {
          events: stripSeq(result.events),
          spawns: result.spawns.map((s) => ({
            ...s,
            parentActorId: state.actorId,
            nodeId: null,
          })),
        }
      }
      case 'tool.execute': {
        if (state.kind !== 'agent' || definition.kind !== 'agent') {
          return { events: [], spawns: [] }
        }
        const result = yield* executeToolCall(definition, state, work.turn, work.toolCall)
        return {
          events: stripSeq(result.events),
          spawns: result.spawns.map((s) => ({
            ...s,
            parentActorId: state.actorId,
            nodeId: null,
          })),
        }
      }
      case 'workflow.schedule': {
        if (state.kind !== 'workflow' || definition.kind !== 'workflow') {
          return { events: [], spawns: [] }
        }
        const scheduled = scheduleWorkflow(definition, state)
        const nodeStarts = scheduled.filter((e) => e.type === 'workflow.node.started')
        const events: LoomsEvent[] = [...scheduled]
        const spawns: SpawnRequest[] = []
        for (const start of nodeStarts) {
          const nodeId = start.payload.nodeId
          if (!nodeId) continue
          const runningState = {
            ...state,
            nodes: {
              ...state.nodes,
              [nodeId]: {
                status: 'running' as const,
                result: null,
                error: null,
              },
            },
          }
          const executed = yield* executeWorkflowNode(definition, runningState, nodeId)
          events.push(...executed.events)
          for (const s of executed.spawns) {
            spawns.push({
              childActorId: s.childActorId,
              kind: s.kind,
              definitionName: s.definitionName,
              definition: s.definition,
              input: s.input,
              parentActorId: state.actorId,
              toolCallId: null,
              nodeId: s.nodeId,
            })
            if (s.definition?.kind === 'agent') {
              registry.agents.set(s.definition.name, s.definition)
            } else if (s.definition?.kind === 'workflow') {
              registry.workflows.set(s.definition.name, s.definition)
            }
          }
        }
        return { events: stripSeq(events), spawns }
      }
      case 'workflow.run_node': {
        if (state.kind !== 'workflow' || definition.kind !== 'workflow') {
          return { events: [], spawns: [] }
        }
        const started = event('workflow.node.started', state.actorId, { nodeId: work.nodeId })
        const runningState = {
          ...state,
          nodes: {
            ...state.nodes,
            [work.nodeId]: { status: 'running' as const, result: null, error: null },
          },
        }
        const executed = yield* executeWorkflowNode(definition, runningState, work.nodeId)
        return {
          events: stripSeq([started, ...executed.events]),
          spawns: executed.spawns.map((s) => ({
            childActorId: s.childActorId,
            kind: s.kind,
            definitionName: s.definitionName,
            definition: s.definition,
            input: s.input,
            parentActorId: state.actorId,
            toolCallId: null,
            nodeId: s.nodeId,
          })),
        }
      }
      case 'finalize': {
        if (state.status === 'failed' || state.error) {
          return {
            events: stripSeq([
              event('actor.failed', state.actorId, {
                error: state.error ?? 'Actor failed',
              }),
            ]),
            spawns: [],
          }
        }
        return {
          events: stripSeq([
            event('actor.completed', state.actorId, {
              output: state.output ?? null,
            }),
          ]),
          spawns: [],
        }
      }
      case 'review.wait':
      case 'child.wait':
      case 'timer.wait':
        return { events: [], spawns: [] }
      default: {
        const _exhaustive: never = work
        return _exhaustive
      }
    }
  })
}
