/**
 * Canonical Looms event type names for LiveStore event defs.
 * Kept free of `@looms/core` so client bundles can import the schema without the host graph.
 */
export const LOOMS_EVENT_NAMES = [
  'actor.started',
  'actor.completed',
  'actor.failed',
  'actor.cancelled',
  'agent.message.received',
  'agent.turn.started',
  'agent.turn.text_delta',
  'agent.turn.steered',
  'agent.message',
  'agent.tool_call.requested',
  'tool.result',
  'child.spawned',
  'child.completed',
  'workflow.node.started',
  'workflow.node.finished',
  'workflow.node.skipped',
  'review.requested',
  'review.decided',
  'review.timed_out',
  'timer.set',
  'timer.fired',
  'snapshot.taken',
] as const

export type LoomsEventName = (typeof LOOMS_EVENT_NAMES)[number]
