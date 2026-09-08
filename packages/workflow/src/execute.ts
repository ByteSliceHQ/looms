import {
  event,
  type AgentDefinition,
  type JsonValue,
  type NodeResult,
  type TypedLoomsEvent,
  type WorkflowDefinition,
  type WorkflowNodeContext,
  type WorkflowState,
} from '@looms/core'
import { Effect, Predicate, Schema } from 'effect'

export type WorkflowEvent = TypedLoomsEvent

export interface ExecuteNodeResult {
  events: WorkflowEvent[]
  spawns: Array<{
    childActorId: string
    kind: 'agent' | 'workflow'
    definitionName: string
    definition?: AgentDefinition | WorkflowDefinition
    input: JsonValue
    nodeId: string | null
  }>
}

function createChildId(parentId: string, name: string): string {
  return `${parentId}__${name}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function createReviewId(): string {
  return `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function createTimerId(): string {
  return `tmr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const NodeResultTypeSchema = Schema.Literals(['value', 'review', 'wait', 'spawn_agent', 'spawn_workflow'] as const)

function isNodeResult(raw: JsonValue | NodeResult): raw is NodeResult {
  if (!Predicate.isReadonlyObject(raw) || !('type' in raw)) return false
  return Schema.is(NodeResultTypeSchema)(raw.type)
}

function normalizeResult(raw: JsonValue | NodeResult): NodeResult {
  if (isNodeResult(raw)) return raw
  return { type: 'value', value: raw }
}

/**
 * Execute a workflow node that is owed as `workflow.run_node`.
 * Caller should already have appended `workflow.node.started` (via schedule) or we emit it here if missing.
 */
export const executeWorkflowNode = (
  definition: WorkflowDefinition,
  state: WorkflowState,
  nodeId: string,
): Effect.Effect<ExecuteNodeResult, Error> =>
  Effect.gen(function* () {
    const nodeDef = definition.nodes.find((n) => n.id === nodeId)
    if (!nodeDef) {
      return {
        events: [
          event('workflow.node.finished', state.actorId, {
            nodeId,
            result: null,
            error: `Unknown node: ${nodeId}`,
          }),
        ],
        spawns: [],
      }
    }

    const results: Record<string, JsonValue | null> = {}
    for (const [id, node] of Object.entries(state.nodes)) {
      results[id] = node.result
    }

    const ctx: WorkflowNodeContext = {
      actorId: state.actorId,
      nodeId,
      input: state.input,
      results,
      requestReview: (request) => ({ type: 'review', review: request }),
      // SAFETY: child input is JSON-serializable when passed across actor boundaries.
      spawnAgent: (agent, input) => ({ type: 'spawn_agent', agent, input: input as JsonValue }),
      // SAFETY: child input is JSON-serializable when passed across actor boundaries.
      spawnWorkflow: (workflow, input) => ({ type: 'spawn_workflow', workflow, input: input as JsonValue }),
    }

    const raw = yield* Effect.tryPromise({
      try: () => Promise.resolve(nodeDef.run(ctx)),
      catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
    }).pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
    )

    if (!raw.ok) {
      return {
        events: [
          event('workflow.node.finished', state.actorId, {
            nodeId,
            result: null,
            error: raw.error,
          }),
        ],
        spawns: [],
      }
    }

    const result = normalizeResult(raw.value)
    switch (result.type) {
      case 'value':
        return {
          events: [
            event('workflow.node.finished', state.actorId, {
              nodeId,
              result: result.value,
              error: null,
            }),
          ],
          spawns: [],
        }
      case 'review': {
        const reviewId = createReviewId()
        const actions = result.review.actions ?? [
          { id: 'approve', label: 'Approve', outcome: 'approve' as const },
          { id: 'reject', label: 'Reject', outcome: 'reject' as const },
        ]
        return {
          events: [
            event('review.requested', state.actorId, {
              reviewId,
              title: result.review.title,
              description: result.review.description,
              schema: result.review.schema,
              actions,
              nodeId,
            }),
          ],
          spawns: [],
        }
      }
      case 'wait': {
        const timerId = createTimerId()
        const wakeAt = Date.now() + result.ms
        // Park via timer; runtime will finish this node when the timer fires.
        return {
          events: [
            event('timer.set', state.actorId, {
              timerId,
              wakeAt,
              nodeId,
            }),
          ],
          spawns: [],
        }
      }
      case 'spawn_agent': {
        const childActorId = createChildId(state.actorId, result.agent.name)
        return {
          events: [
            event('child.spawned', state.actorId, {
              childActorId,
              childKind: 'agent',
              childDefinitionName: result.agent.name,
              toolCallId: null,
              nodeId,
              input: result.input,
            }),
          ],
          spawns: [
            {
              childActorId,
              kind: 'agent' as const,
              definitionName: result.agent.name,
              definition: result.agent,
              input: result.input,
              nodeId,
            },
          ],
        }
      }
      case 'spawn_workflow': {
        const childActorId = createChildId(state.actorId, result.workflow.name)
        return {
          events: [
            event('child.spawned', state.actorId, {
              childActorId,
              childKind: 'workflow',
              childDefinitionName: result.workflow.name,
              toolCallId: null,
              nodeId,
              input: result.input,
            }),
          ],
          spawns: [
            {
              childActorId,
              kind: 'workflow' as const,
              definitionName: result.workflow.name,
              definition: result.workflow,
              input: result.input,
              nodeId,
            },
          ],
        }
      }
      default: {
        const _exhaustive: never = result
        return _exhaustive
      }
    }
  })
