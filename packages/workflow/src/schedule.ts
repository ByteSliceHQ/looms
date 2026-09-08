import {
  event,
  readyNodes,
  type TypedLoomsEvent,
  type WorkflowDefinition,
  type WorkflowState,
} from '@looms/core'

export type WorkflowEvent = TypedLoomsEvent

/**
 * From owed `workflow.schedule`, emit `workflow.run_node` starters for ready nodes
 * up to remaining concurrency. If the DAG is finished, emit `actor.completed`.
 */
export function scheduleWorkflow(
  definition: WorkflowDefinition,
  state: WorkflowState,
): WorkflowEvent[] {
  const running = Object.values(state.nodes).filter((n) => n.status === 'running').length
  const waitingReview = Object.values(state.nodes).filter((n) => n.status === 'waiting_review').length
  const slots = Math.max(0, state.concurrency - running)
  const ready = readyNodes(definition, state.nodes).slice(0, slots)

  if (ready.length > 0) {
    return ready.map((nodeId) => event('workflow.node.started', state.actorId, { nodeId }))
  }

  const pending = Object.values(state.nodes).some(
    (n) => n.status === 'pending' || n.status === 'running' || n.status === 'waiting_review',
  )
  if (pending || waitingReview > 0 || running > 0) {
    // Nothing schedulable right now (blocked on deps / concurrency / waits).
    return []
  }

  const failed = Object.entries(state.nodes).find(([, n]) => n.status === 'failed')
  if (failed) {
    return [
      event('actor.failed', state.actorId, {
        error: failed[1].error ?? `Node ${failed[0]} failed`,
      }),
    ]
  }

  const results: Record<string, (typeof state.nodes)[string]['result']> = {}
  for (const [id, node] of Object.entries(state.nodes)) {
    results[id] = node.result
  }
  const output = definition.output
    ? definition.output({ input: state.input, results })
    : results

  return [event('actor.completed', state.actorId, { output })]
}
