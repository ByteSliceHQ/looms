import type {
  AgentState,
  ActorState,
  JsonValue,
  OwedWork,
  WorkflowState,
} from './types'
import type { EventPayloadMap, EventType, LoomsEvent } from './events'

function initialAgent(
  actorId: string,
  definitionName: string,
  input: JsonValue,
  parentActorId: string | null,
  maxTurns = 20,
): AgentState {
  return {
    actorId,
    kind: 'agent',
    status: 'pending',
    definitionName,
    input,
    output: null,
    error: null,
    parentActorId,
    children: {},
    reviews: {},
    owed: [],
    messages: [],
    pendingToolCalls: [],
    turn: 0,
    maxTurns,
    pendingSteer: null,
  }
}

function initialWorkflow(
  actorId: string,
  definitionName: string,
  input: JsonValue,
  parentActorId: string | null,
  nodeIds: string[],
  concurrency = 8,
): WorkflowState {
  return {
    actorId,
    kind: 'workflow',
    status: 'pending',
    definitionName,
    input,
    output: null,
    error: null,
    parentActorId,
    children: {},
    reviews: {},
    owed: [],
    concurrency,
    nodes: Object.fromEntries(
      nodeIds.map((nodeId) => [nodeId, { status: 'pending' as const, result: null, error: null }]),
    ),
  }
}

function setOwed<S extends ActorState>(state: S, owed: OwedWork[]): S {
  return { ...state, owed }
}

function appendOwed<S extends ActorState>(state: S, work: OwedWork): S {
  return setOwed(state, [...state.owed, work])
}

function removeOwed<S extends ActorState>(
  state: S,
  predicate: (work: OwedWork) => boolean,
): S {
  return setOwed(
    state,
    state.owed.filter((work) => !predicate(work)),
  )
}

function payloadOf<T extends EventType>(event: LoomsEvent): EventPayloadMap[T] {
  // SAFETY: callers invoke only after matching event.type to T; LoomsEvent.payload is JsonValue carrying EventPayloadMap[T] by the durable log contract.
  return event.payload as EventPayloadMap[T]
}

function applyAgentEvent(state: AgentState, event: LoomsEvent): AgentState {
  switch (event.type) {
    case 'actor.started': {
      const payload = payloadOf<'actor.started'>(event)
      return appendOwed(
        {
          ...state,
          status: 'running',
          definitionName: payload.definitionName,
          input: payload.input,
          parentActorId: payload.parentActorId,
          maxTurns: payload.maxTurns ?? state.maxTurns,
        },
        { type: 'agent.turn', turn: 1 },
      )
    }
    case 'agent.message.received': {
      const payload = payloadOf<'agent.message.received'>(event)
      const next: AgentState = {
        ...state,
        messages: [...state.messages, payload.message],
        status: state.status === 'completed' || state.status === 'failed' ? state.status : 'running',
      }
      if (state.pendingToolCalls.length === 0 && !state.owed.some((w) => w.type === 'agent.turn')) {
        return appendOwed(next, { type: 'agent.turn', turn: state.turn + 1 })
      }
      return next
    }
    case 'agent.turn.started': {
      const payload = payloadOf<'agent.turn.started'>(event)
      return removeOwed(
        { ...state, turn: payload.turn, status: 'running', pendingSteer: null },
        (w) => w.type === 'agent.turn' && w.turn === payload.turn,
      )
    }
    case 'agent.message': {
      const payload = payloadOf<'agent.message'>(event)
      return {
        ...state,
        messages: [...state.messages, payload.message],
      }
    }
    case 'agent.tool_call.requested': {
      const payload = payloadOf<'agent.tool_call.requested'>(event)
      return appendOwed(
        {
          ...state,
          pendingToolCalls: [...state.pendingToolCalls, payload.toolCall],
        },
        { type: 'tool.execute', turn: payload.turn, toolCall: payload.toolCall },
      )
    }
    case 'tool.result': {
      const payload = payloadOf<'tool.result'>(event)
      const pendingToolCalls = state.pendingToolCalls.filter((t) => t.id !== payload.toolCallId)
      let next = removeOwed(
        {
          ...state,
          pendingToolCalls,
          messages: [
            ...state.messages,
            {
              role: 'tool' as const,
              content: payload.error ?? JSON.stringify(payload.result ?? null),
              toolCallId: payload.toolCallId,
              name: payload.name,
            },
          ],
        },
        (w) => w.type === 'tool.execute' && w.toolCall.id === payload.toolCallId,
      )
      if (pendingToolCalls.length === 0 && next.status === 'running') {
        next = appendOwed(next, { type: 'agent.turn', turn: state.turn + 1 })
      }
      return next
    }
    case 'child.spawned': {
      const payload = payloadOf<'child.spawned'>(event)
      let next: AgentState = {
        ...state,
        status: 'waiting_child',
        children: {
          ...state.children,
          [payload.childActorId]: {
            kind: payload.childKind,
            definitionName: payload.childDefinitionName,
            status: 'running',
          },
        },
      }
      if (payload.toolCallId) {
        next = removeOwed(
          {
            ...next,
            pendingToolCalls: next.pendingToolCalls.filter((t) => t.id !== payload.toolCallId),
          },
          (w) => w.type === 'tool.execute' && w.toolCall.id === payload.toolCallId,
        )
      }
      return appendOwed(next, { type: 'child.wait', childActorId: payload.childActorId })
    }
    case 'child.completed': {
      const payload = payloadOf<'child.completed'>(event)
      const child = state.children[payload.childActorId]
      let next = removeOwed(
        {
          ...state,
          children: {
            ...state.children,
            [payload.childActorId]: {
              kind: child?.kind ?? 'agent',
              definitionName: child?.definitionName ?? 'unknown',
              status: payload.error ? 'failed' : 'completed',
              output: payload.result,
              error: payload.error,
            },
          },
        },
        (w) => w.type === 'child.wait' && w.childActorId === payload.childActorId,
      )
      const waiting = Object.values(next.children).some((c) => c.status === 'running')
      if (!waiting && next.status === 'waiting_child') {
        next = appendOwed({ ...next, status: 'running' }, { type: 'agent.turn', turn: next.turn + 1 })
      }
      return next
    }
    case 'review.requested': {
      const payload = payloadOf<'review.requested'>(event)
      return appendOwed(
        {
          ...state,
          status: 'waiting_review',
          reviews: {
            ...state.reviews,
            [payload.reviewId]: {
              reviewId: payload.reviewId,
              title: payload.title,
              description: payload.description,
              schema: payload.schema,
              actions: payload.actions,
              nodeId: payload.nodeId,
              status: 'pending',
            },
          },
        },
        { type: 'review.wait', reviewId: payload.reviewId },
      )
    }
    case 'review.decided': {
      const payload = payloadOf<'review.decided'>(event)
      const existing = state.reviews[payload.reviewId]
      let next = removeOwed(
        {
          ...state,
          reviews: {
            ...state.reviews,
            [payload.reviewId]: {
              reviewId: payload.reviewId,
              title: existing?.title ?? 'Review',
              description: existing?.description,
              schema: existing?.schema,
              actions: existing?.actions ?? [],
              nodeId: existing?.nodeId,
              status: payload.outcome === 'approve' ? 'approved' : 'rejected',
              decision: payload.payload ?? { actionId: payload.actionId },
            },
          },
        },
        (w) => w.type === 'review.wait' && w.reviewId === payload.reviewId,
      )
      if (payload.outcome === 'reject') {
        return appendOwed(
          { ...next, status: 'failed', error: `Review ${payload.reviewId} rejected` },
          { type: 'finalize' },
        )
      }
      return appendOwed({ ...next, status: 'running' }, { type: 'agent.turn', turn: next.turn + 1 })
    }
    case 'actor.completed': {
      const payload = payloadOf<'actor.completed'>(event)
      return setOwed(
        { ...state, status: 'completed', output: payload.output, owed: [] },
        [],
      )
    }
    case 'actor.failed': {
      const payload = payloadOf<'actor.failed'>(event)
      return setOwed({ ...state, status: 'failed', error: payload.error, owed: [] }, [])
    }
    case 'actor.cancelled':
      return setOwed({ ...state, status: 'cancelled', owed: [] }, [])
    case 'agent.turn.steered': {
      const payload = payloadOf<'agent.turn.steered'>(event)
      let next: AgentState = {
        ...state,
        messages: [...state.messages, payload.message],
        pendingSteer: payload.message,
        status: 'running',
      }
      if (payload.interrupt) {
        next = {
          ...next,
          pendingToolCalls: [],
          owed: next.owed.filter((w) => w.type !== 'tool.execute'),
        }
        next = appendOwed(next, {
          type: 'agent.turn',
          turn: Math.max(state.turn, payload.turn) + 1,
        })
      }
      return next
    }
    case 'agent.turn.text_delta':
    case 'snapshot.taken':
    case 'workflow.node.started':
    case 'workflow.node.finished':
    case 'workflow.node.skipped':
    case 'timer.set':
    case 'timer.fired':
    case 'review.timed_out':
      return state
    default:
      return state
  }
}

function applyWorkflowEvent(state: WorkflowState, event: LoomsEvent): WorkflowState {
  switch (event.type) {
    case 'actor.started': {
      const payload = payloadOf<'actor.started'>(event)
      const nodeIds = payload.nodeIds ?? Object.keys(state.nodes)
      return appendOwed(
        {
          ...state,
          status: 'running',
          definitionName: payload.definitionName,
          input: payload.input,
          parentActorId: payload.parentActorId,
          concurrency: payload.concurrency ?? state.concurrency,
          nodes: Object.fromEntries(
            nodeIds.map((nodeId) => [
              nodeId,
              state.nodes[nodeId] ?? { status: 'pending' as const, result: null, error: null },
            ]),
          ),
        },
        { type: 'workflow.schedule' },
      )
    }
    case 'workflow.node.started': {
      const payload = payloadOf<'workflow.node.started'>(event)
      return removeOwed(
        removeOwed(
          {
            ...state,
            nodes: {
              ...state.nodes,
              [payload.nodeId]: {
                status: 'running',
                result: null,
                error: null,
                reviewId: state.nodes[payload.nodeId]?.reviewId,
              },
            },
          },
          (w) => w.type === 'workflow.run_node' && w.nodeId === payload.nodeId,
        ),
        (w) => w.type === 'workflow.schedule',
      )
    }
    case 'workflow.node.finished': {
      const payload = payloadOf<'workflow.node.finished'>(event)
      const next: WorkflowState = {
        ...state,
        nodes: {
          ...state.nodes,
          [payload.nodeId]: {
            status: payload.error ? 'failed' : 'completed',
            result: payload.result,
            error: payload.error,
          },
        },
      }
      if (payload.error) {
        return appendOwed(
          { ...next, status: 'failed', error: payload.error },
          { type: 'finalize' },
        )
      }
      return appendOwed(
        removeOwed(next, (w) => w.type === 'workflow.schedule'),
        { type: 'workflow.schedule' },
      )
    }
    case 'workflow.node.skipped': {
      const payload = payloadOf<'workflow.node.skipped'>(event)
      return appendOwed(
        removeOwed(
          {
            ...state,
            nodes: {
              ...state.nodes,
              [payload.nodeId]: {
                status: 'skipped',
                result: null,
                error: null,
              },
            },
          },
          (w) => w.type === 'workflow.schedule',
        ),
        { type: 'workflow.schedule' },
      )
    }
    case 'review.requested': {
      const payload = payloadOf<'review.requested'>(event)
      const nodeId = payload.nodeId
      return appendOwed(
        {
          ...state,
          status: 'waiting_review',
          reviews: {
            ...state.reviews,
            [payload.reviewId]: {
              reviewId: payload.reviewId,
              title: payload.title,
              description: payload.description,
              schema: payload.schema,
              actions: payload.actions,
              nodeId,
              status: 'pending',
            },
          },
          nodes: nodeId
            ? {
                ...state.nodes,
                [nodeId]: {
                  status: 'waiting_review',
                  result: null,
                  error: null,
                  reviewId: payload.reviewId,
                },
              }
            : state.nodes,
        },
        { type: 'review.wait', reviewId: payload.reviewId },
      )
    }
    case 'review.decided': {
      const payload = payloadOf<'review.decided'>(event)
      const existing = state.reviews[payload.reviewId]
      const nodeId = existing?.nodeId
      let next = removeOwed(
        {
          ...state,
          reviews: {
            ...state.reviews,
            [payload.reviewId]: {
              reviewId: payload.reviewId,
              title: existing?.title ?? 'Review',
              description: existing?.description,
              schema: existing?.schema,
              actions: existing?.actions ?? [],
              nodeId,
              status: payload.outcome === 'approve' ? 'approved' : 'rejected',
              decision: payload.payload ?? { actionId: payload.actionId },
            },
          },
        },
        (w) => w.type === 'review.wait' && w.reviewId === payload.reviewId,
      )
      if (payload.outcome === 'reject') {
        return appendOwed(
          {
            ...next,
            status: 'failed',
            error: `Review ${payload.reviewId} rejected`,
            nodes: nodeId
              ? {
                  ...next.nodes,
                  [nodeId]: {
                    status: 'failed',
                    result: null,
                    error: 'rejected',
                    reviewId: payload.reviewId,
                  },
                }
              : next.nodes,
          },
          { type: 'finalize' },
        )
      }
      if (nodeId) {
        next = {
          ...next,
          status: 'running',
          nodes: {
            ...next.nodes,
            [nodeId]: {
              status: 'completed',
              result: payload.payload ?? { approved: true },
              error: null,
              reviewId: payload.reviewId,
            },
          },
        }
        return appendOwed(
          removeOwed(next, (w) => w.type === 'workflow.schedule'),
          { type: 'workflow.schedule' },
        )
      }
      return appendOwed(
        removeOwed({ ...next, status: 'running' }, (w) => w.type === 'workflow.schedule'),
        { type: 'workflow.schedule' },
      )
    }
    case 'child.spawned': {
      const payload = payloadOf<'child.spawned'>(event)
      return appendOwed(
        {
          ...state,
          status: 'waiting_child',
          children: {
            ...state.children,
            [payload.childActorId]: {
              kind: payload.childKind,
              definitionName: payload.childDefinitionName,
              status: 'running',
            },
          },
        },
        { type: 'child.wait', childActorId: payload.childActorId },
      )
    }
    case 'child.completed': {
      const payload = payloadOf<'child.completed'>(event)
      const child = state.children[payload.childActorId]
      let next = removeOwed(
        {
          ...state,
          children: {
            ...state.children,
            [payload.childActorId]: {
              kind: child?.kind ?? 'workflow',
              definitionName: child?.definitionName ?? 'unknown',
              status: payload.error ? 'failed' : 'completed',
              output: payload.result,
              error: payload.error,
            },
          },
        },
        (w) => w.type === 'child.wait' && w.childActorId === payload.childActorId,
      )
      const waiting = Object.values(next.children).some((c) => c.status === 'running')
      if (!waiting) {
        next = { ...next, status: 'running' }
        return appendOwed(
          removeOwed(next, (w) => w.type === 'workflow.schedule'),
          { type: 'workflow.schedule' },
        )
      }
      return next
    }
    case 'timer.set': {
      const payload = payloadOf<'timer.set'>(event)
      return appendOwed(
        removeOwed(
          { ...state, status: 'waiting_timer' },
          (w) => w.type === 'workflow.schedule',
        ),
        { type: 'timer.wait', timerId: payload.timerId, wakeAt: payload.wakeAt },
      )
    }
    case 'timer.fired': {
      const payload = payloadOf<'timer.fired'>(event)
      return appendOwed(
        removeOwed(
          removeOwed(
            { ...state, status: 'running' },
            (w) => w.type === 'timer.wait' && w.timerId === payload.timerId,
          ),
          (w) => w.type === 'workflow.schedule',
        ),
        { type: 'workflow.schedule' },
      )
    }
    case 'actor.completed': {
      const payload = payloadOf<'actor.completed'>(event)
      return setOwed({ ...state, status: 'completed', output: payload.output, owed: [] }, [])
    }
    case 'actor.failed': {
      const payload = payloadOf<'actor.failed'>(event)
      return setOwed({ ...state, status: 'failed', error: payload.error, owed: [] }, [])
    }
    case 'actor.cancelled':
      return setOwed({ ...state, status: 'cancelled', owed: [] }, [])
    case 'snapshot.taken':
    case 'agent.message.received':
    case 'agent.turn.started':
    case 'agent.turn.text_delta':
    case 'agent.turn.steered':
    case 'agent.message':
    case 'agent.tool_call.requested':
    case 'tool.result':
    case 'review.timed_out':
      return state
    default:
      return state
  }
}

export function reduceActor(
  events: LoomsEvent[],
  options?: {
    actorId?: string
    kind?: 'agent' | 'workflow'
    definitionName?: string
    input?: JsonValue
    nodeIds?: string[]
  },
): ActorState {
  const first = events.find((e) => e.type === 'actor.started')
  const started = first ? payloadOf<'actor.started'>(first) : undefined
  const kind = options?.kind ?? started?.kind ?? 'agent'
  const actorId = options?.actorId ?? events[0]?.actorId ?? 'unknown'
  const definitionName = options?.definitionName ?? started?.definitionName ?? 'unknown'
  const input = options?.input ?? started?.input ?? null
  const parentActorId = started?.parentActorId ?? null

  let state: ActorState =
    kind === 'workflow'
      ? initialWorkflow(
          actorId,
          definitionName,
          input,
          parentActorId,
          options?.nodeIds ?? started?.nodeIds ?? [],
          started?.concurrency,
        )
      : initialAgent(actorId, definitionName, input, parentActorId, started?.maxTurns)

  for (const event of events) {
    if (event.ephemeral) continue
    if (state.kind === 'agent') {
      state = applyAgentEvent(state, event)
    } else {
      state = applyWorkflowEvent(state, event)
    }
  }

  return state
}

export function isTerminal(state: ActorState): boolean {
  return state.status === 'completed' || state.status === 'failed' || state.status === 'cancelled'
}

export function isParked(state: ActorState): boolean {
  return (
    state.status === 'waiting_review' ||
    state.status === 'waiting_child' ||
    state.status === 'waiting_timer' ||
    state.owed.every(
      (w) => w.type === 'review.wait' || w.type === 'child.wait' || w.type === 'timer.wait',
    )
  )
}
