import { Schema } from 'effect'
import type { ActorKind, JsonValue, Message, ToolCall } from './types'

/** JSON-compatible wire schema (Effect 4 mutable JSON). */
export const JsonValueSchema = Schema.MutableJson

export const EventTypeSchema = Schema.Literals([
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
] as const)

export type EventType = Schema.Schema.Type<typeof EventTypeSchema>

export const EventOriginSchema = Schema.Struct({
  clientId: Schema.String,
  sessionId: Schema.String,
})

export type EventOrigin = Schema.Schema.Type<typeof EventOriginSchema>

export const LoomsEventSchema = Schema.Struct({
  id: Schema.String,
  actorId: Schema.String,
  type: EventTypeSchema,
  seq: Schema.Number,
  ts: Schema.Number,
  ephemeral: Schema.optional(Schema.Boolean),
  parentActorId: Schema.optional(Schema.NullOr(Schema.String)),
  origin: Schema.optional(EventOriginSchema),
  payload: JsonValueSchema,
})

/** Wire / Schema shape before payload is treated as typed EventPayloadMap. */
export type WireLoomsEvent = Schema.Schema.Type<typeof LoomsEventSchema>

export type EventPayloadMap = {
  'actor.started': ActorStartedPayload
  'actor.completed': ActorCompletedPayload
  'actor.failed': ActorFailedPayload
  'actor.cancelled': { reason?: string }
  'agent.message.received': AgentMessageReceivedPayload
  'agent.turn.started': AgentTurnStartedPayload
  'agent.turn.text_delta': AgentTurnTextDeltaPayload
  'agent.turn.steered': AgentTurnSteeredPayload
  'agent.message': AgentMessagePayload
  'agent.tool_call.requested': AgentToolCallRequestedPayload
  'tool.result': ToolResultPayload
  'child.spawned': ChildSpawnedPayload
  'child.completed': ChildCompletedPayload
  'workflow.node.started': WorkflowNodeStartedPayload
  'workflow.node.finished': WorkflowNodeFinishedPayload
  'workflow.node.skipped': WorkflowNodeSkippedPayload
  'review.requested': ReviewRequestedPayload
  'review.decided': ReviewDecidedPayload
  'review.timed_out': ReviewTimedOutPayload
  'timer.set': TimerSetPayload
  'timer.fired': TimerFiredPayload
  'snapshot.taken': SnapshotTakenPayload
}

/** Discriminated durable event — payload type follows `type`. */
export type LoomsEvent = {
  [K in EventType]: {
    id: string
    actorId: string
    type: K
    seq: number
    ts: number
    ephemeral?: boolean
    parentActorId?: string | null
    origin?: EventOrigin
    payload: EventPayloadMap[K]
  }
}[EventType]

export type TypedLoomsEvent<T extends EventType = EventType> = Extract<LoomsEvent, { type: T }>

/**
 * Seq-optional form that preserves type↔payload correlation (plain `Omit<LoomsEvent,'seq'>` collapses the union).
 */
export type AppendableLoomsEvent = {
  [K in EventType]: Omit<Extract<LoomsEvent, { type: K }>, 'seq'> & { seq?: number }
}[EventType]

/** Minimal typed signal / commit input. */
export type LoomsEventSignal = {
  [K in EventType]: {
    type: K
    payload: EventPayloadMap[K]
    id?: string
    ts?: number
    ephemeral?: boolean
    parentActorId?: string | null
    origin?: EventOrigin
  }
}[EventType]

/**
 * Promote a wire-decoded event (JsonValue payload) into the typed event union.
 */
export function fromWireEvent(wire: WireLoomsEvent): LoomsEvent {
  // SAFETY: durable writers only append via event() with EventPayloadMap payloads; store/S2 decode preserves that contract.
  return wire as LoomsEvent
}

/** Assign actorId + seq to an appendable event, restoring a full LoomsEvent. */
export function withAssignedSeq(
  partial: AppendableLoomsEvent,
  actorId: string,
  seq: number,
): LoomsEvent {
  // SAFETY: AppendableLoomsEvent is the seq-omitted LoomsEvent member; adding seq restores that member.
  return { ...partial, actorId, seq } as LoomsEvent
}

/** Serialize a typed domain payload for JsonValue storage (EventRow, HTTP, etc.). */
export function payloadAsJson(payload: EventPayloadMap[EventType]): JsonValue {
  // SAFETY: EventPayloadMap values are JSON-serializable; round-trip yields JsonValue.
  return JSON.parse(JSON.stringify(payload)) as JsonValue
}

/** Build a LoomsEvent from a typed signal (HTTP / client commit). */
export function eventFromSignal(
  signal: LoomsEventSignal,
  actorId: string,
  options?: { seq?: number },
): LoomsEvent {
  // SAFETY: LoomsEventSignal preserves type↔payload correlation; filling identity fields yields LoomsEvent.
  return {
    id: signal.id ?? createEventId(),
    actorId,
    type: signal.type,
    seq: options?.seq ?? 0,
    ts: signal.ts ?? Date.now(),
    ephemeral: signal.ephemeral,
    parentActorId: signal.parentActorId,
    origin: signal.origin,
    payload: signal.payload,
  } as LoomsEvent
}

export interface ActorStartedPayload {
  kind: ActorKind
  definitionName: string
  input: JsonValue
  parentActorId: string | null
  maxTurns?: number
  concurrency?: number
  nodeIds?: string[]
}

export interface AgentMessageReceivedPayload {
  message: Message
}

export interface AgentTurnStartedPayload {
  turn: number
}

export interface AgentTurnTextDeltaPayload {
  turn: number
  delta: string
}

export interface AgentTurnSteeredPayload {
  turn: number
  message: Message
  /** When true, cancel pending tool calls and start a fresh turn after steer. */
  interrupt?: boolean
}

export interface AgentMessagePayload {
  turn: number
  message: Message
}

export interface AgentToolCallRequestedPayload {
  turn: number
  toolCall: ToolCall
}

export interface ToolResultPayload {
  turn: number | null
  toolCallId: string
  name: string
  result: JsonValue
  error: string | null
}

export interface ChildSpawnedPayload {
  childActorId: string
  childKind: ActorKind
  childDefinitionName: string
  toolCallId: string | null
  nodeId: string | null
  input: JsonValue
}

export interface ChildCompletedPayload {
  childActorId: string
  result: JsonValue | null
  error: string | null
}

export interface WorkflowNodeStartedPayload {
  nodeId: string
}

export interface WorkflowNodeFinishedPayload {
  nodeId: string
  result: JsonValue | null
  error: string | null
}

export interface WorkflowNodeSkippedPayload {
  nodeId: string
  reason: string
}

export interface ReviewRequestedPayload {
  reviewId: string
  title: string
  description?: string
  schema?: JsonValue
  actions: Array<{ id: string; label: string; outcome: 'approve' | 'reject' }>
  nodeId?: string
  timeoutMs?: number
}

export interface ReviewDecidedPayload {
  reviewId: string
  actionId: string
  outcome: 'approve' | 'reject'
  payload?: JsonValue
}

export interface ReviewTimedOutPayload {
  reviewId: string
}

export interface TimerSetPayload {
  timerId: string
  wakeAt: number
  nodeId?: string
}

export interface TimerFiredPayload {
  timerId: string
}

export interface ActorCompletedPayload {
  output: JsonValue
}

export interface ActorFailedPayload {
  error: string
}

export interface SnapshotTakenPayload {
  /** Inclusive seq covered by this snapshot. */
  seq: number
  stateHash: string
  /** Compact actor state blob for fast cold start (JSON). */
  state?: JsonValue
}

export const SnapshotTakenPayloadSchema = Schema.Struct({
  seq: Schema.Number,
  stateHash: Schema.String,
  state: Schema.optional(JsonValueSchema),
})

let eventCounter = 0

export function createEventId(): string {
  eventCounter += 1
  return `evt_${Date.now().toString(36)}_${eventCounter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function event<T extends EventType>(
  type: T,
  actorId: string,
  payload: EventPayloadMap[T],
  options?: {
    seq?: number
    ts?: number
    id?: string
    ephemeral?: boolean
    parentActorId?: string | null
    origin?: EventOrigin
  },
): TypedLoomsEvent<T> {
  // SAFETY: `type` is T and `payload` is EventPayloadMap[T]; TS cannot prove the generic object literal is Extract<LoomsEvent,{type:T}>.
  return {
    id: options?.id ?? createEventId(),
    actorId,
    type,
    seq: options?.seq ?? 0,
    ts: options?.ts ?? Date.now(),
    ephemeral: options?.ephemeral,
    parentActorId: options?.parentActorId,
    origin: options?.origin,
    payload,
  } as TypedLoomsEvent<T>
}
