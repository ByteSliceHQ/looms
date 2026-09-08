import type { Schema } from 'effect'

/** JSON-compatible values used in event payloads and tool I/O. */
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type ActorKind = 'agent' | 'workflow'
export type ActorStatus =
  | 'pending'
  | 'running'
  | 'waiting_review'
  | 'waiting_child'
  | 'waiting_timer'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_review'

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string
  name?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: JsonValue
}

export interface ChildRef {
  kind: ActorKind
  definitionName: string
  status: ActorStatus
  output?: JsonValue | null
  error?: string | null
}

export interface ReviewRequest {
  reviewId: string
  title: string
  description?: string
  schema?: JsonValue
  actions: Array<{ id: string; label: string; outcome: 'approve' | 'reject' }>
  nodeId?: string
  status: 'pending' | 'approved' | 'rejected' | 'timed_out'
  decision?: JsonValue
}

export interface NodeState {
  status: NodeStatus
  result: JsonValue | null
  error: string | null
  reviewId?: string
}

export interface ActorBase {
  actorId: string
  kind: ActorKind
  status: ActorStatus
  definitionName: string
  input: JsonValue
  output: JsonValue | null
  error: string | null
  parentActorId: string | null
  children: Record<string, ChildRef>
  reviews: Record<string, ReviewRequest>
  owed: OwedWork[]
}

export interface AgentState extends ActorBase {
  kind: 'agent'
  messages: Message[]
  pendingToolCalls: ToolCall[]
  turn: number
  maxTurns: number
  /** Mid-turn steer waiting to be applied between tool steps. */
  pendingSteer: Message | null
}

export interface WorkflowState extends ActorBase {
  kind: 'workflow'
  nodes: Record<string, NodeState>
  concurrency: number
}

export type ActorState = AgentState | WorkflowState

/** Work the host must still perform after reducing the log. */
export type OwedWork =
  | { type: 'agent.turn'; turn: number }
  | { type: 'tool.execute'; turn: number; toolCall: ToolCall }
  | { type: 'workflow.schedule' }
  | { type: 'workflow.run_node'; nodeId: string }
  | { type: 'review.wait'; reviewId: string }
  | { type: 'child.wait'; childActorId: string }
  | { type: 'timer.wait'; timerId: string; wakeAt: number }
  | { type: 'finalize' }

export type SchemaType<A> = Schema.Schema.Type<A>
