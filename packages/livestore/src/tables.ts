import type {
  ActorKind,
  ActorStatus,
  JsonValue,
  Message,
  NodeStatus,
  LoomsEvent,
} from '@looms/core'

export interface ActorRow {
  actorId: string
  kind: ActorKind | null
  status: ActorStatus | null
  definitionName: string | null
  parentActorId: string | null
  input: JsonValue | null
  output: JsonValue | null
  error: string | null
  updatedAt: number
}

export interface MessageRow {
  id: string
  actorId: string
  seq: number
  role: Message['role']
  content: string
  toolCallId: string | null
  name: string | null
  turn: number | null
  ts: number
}

export interface TurnRow {
  actorId: string
  turn: number
  startedAt: number | null
  messageCount: number
}

export interface NodeRow {
  actorId: string
  nodeId: string
  status: NodeStatus
  result: JsonValue | null
  error: string | null
  reviewId: string | null
  updatedAt: number
}

export interface ReviewRow {
  reviewId: string
  actorId: string
  title: string
  description: string | null
  status: 'pending' | 'approved' | 'rejected' | 'timed_out'
  nodeId: string | null
  decision: JsonValue | null
  updatedAt: number
}

export interface EventRow {
  id: string
  actorId: string
  type: LoomsEvent['type']
  seq: number
  ts: number
  ephemeral: boolean
  parentActorId: string | null
  payload: JsonValue
}

export interface MaterializedTables {
  actors: Map<string, ActorRow>
  messages: MessageRow[]
  turns: Map<string, TurnRow>
  nodes: Map<string, NodeRow>
  reviews: Map<string, ReviewRow>
  events: EventRow[]
}

export function emptyTables(): MaterializedTables {
  return {
    actors: new Map(),
    messages: [],
    turns: new Map(),
    nodes: new Map(),
    reviews: new Map(),
    events: [],
  }
}
