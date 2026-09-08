import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { Schema } from 'effect'
import type { ActorState, JsonValue } from './types'
import {
  event,
  JsonValueSchema,
  SnapshotTakenPayloadSchema,
  type SnapshotTakenPayload,
  type LoomsEvent,
  type TypedLoomsEvent,
} from './events'
import { reduceActor } from './reducers'

/** Default: emit a snapshot every N durable (non-ephemeral) events. */
export const DEFAULT_SNAPSHOT_EVERY = 200

const ActorKindSchema = Schema.Literals(['agent', 'workflow'] as const)
const ActorStatusSchema = Schema.Literals(['pending', 'running', 'waiting_review', 'waiting_child', 'waiting_timer', 'completed', 'failed', 'cancelled'] as const)
const NodeStatusSchema = Schema.Literals(['pending', 'running', 'completed', 'failed', 'skipped', 'waiting_review'] as const)

const ToolCallSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  arguments: JsonValueSchema,
})

const MessageSchema = Schema.Struct({
  role: Schema.Literals(['system', 'user', 'assistant', 'tool'] as const),
  content: Schema.String,
  toolCallId: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  toolCalls: Schema.optional(Schema.mutable(Schema.Array(ToolCallSchema))),
})

const ChildRefSchema = Schema.Struct({
  kind: ActorKindSchema,
  definitionName: Schema.String,
  status: ActorStatusSchema,
  output: Schema.optional(Schema.NullOr(JsonValueSchema)),
  error: Schema.optional(Schema.NullOr(Schema.String)),
})

const ReviewRequestSchema = Schema.Struct({
  reviewId: Schema.String,
  title: Schema.String,
  description: Schema.optional(Schema.String),
  schema: Schema.optional(JsonValueSchema),
  actions: Schema.mutable(
    Schema.Array(
      Schema.Struct({
        id: Schema.String,
        label: Schema.String,
        outcome: Schema.Literals(['approve', 'reject'] as const),
      }),
    ),
  ),
  nodeId: Schema.optional(Schema.String),
  status: Schema.Literals(['pending', 'approved', 'rejected', 'timed_out'] as const),
  decision: Schema.optional(JsonValueSchema),
})

const NodeStateSchema = Schema.Struct({
  status: NodeStatusSchema,
  result: Schema.NullOr(JsonValueSchema),
  error: Schema.NullOr(Schema.String),
  reviewId: Schema.optional(Schema.String),
})

const OwedWorkSchema = Schema.Union([
  Schema.Struct({ type: Schema.Literal('agent.turn'), turn: Schema.Number }),
  Schema.Struct({
    type: Schema.Literal('tool.execute'),
    turn: Schema.Number,
    toolCall: ToolCallSchema,
  }),
  Schema.Struct({ type: Schema.Literal('workflow.schedule') }),
  Schema.Struct({ type: Schema.Literal('workflow.run_node'), nodeId: Schema.String }),
  Schema.Struct({ type: Schema.Literal('review.wait'), reviewId: Schema.String }),
  Schema.Struct({ type: Schema.Literal('child.wait'), childActorId: Schema.String }),
  Schema.Struct({
    type: Schema.Literal('timer.wait'),
    timerId: Schema.String,
    wakeAt: Schema.Number,
  }),
  Schema.Struct({ type: Schema.Literal('finalize') }),
])

const ActorBaseFields = {
  actorId: Schema.String,
  status: ActorStatusSchema,
  definitionName: Schema.String,
  input: JsonValueSchema,
  output: Schema.NullOr(JsonValueSchema),
  error: Schema.NullOr(Schema.String),
  parentActorId: Schema.NullOr(Schema.String),
  children: Schema.Record(Schema.String, ChildRefSchema),
  reviews: Schema.Record(Schema.String, ReviewRequestSchema),
  owed: Schema.mutable(Schema.Array(OwedWorkSchema)),
} as const

const AgentStateSchema = Schema.Struct({
  ...ActorBaseFields,
  kind: Schema.Literal('agent'),
  messages: Schema.mutable(Schema.Array(MessageSchema)),
  pendingToolCalls: Schema.mutable(Schema.Array(ToolCallSchema)),
  turn: Schema.Number,
  maxTurns: Schema.Number,
  pendingSteer: Schema.NullOr(MessageSchema),
})

const WorkflowStateSchema = Schema.Struct({
  ...ActorBaseFields,
  kind: Schema.Literal('workflow'),
  nodes: Schema.Record(Schema.String, NodeStateSchema),
  concurrency: Schema.Number,
})

const ActorStateSchema = Schema.Union([AgentStateSchema, WorkflowStateSchema])

function decodeActorState(value: JsonValue): ActorState {
  const decoded = Schema.decodeUnknownSync(ActorStateSchema)(value)
  // SAFETY: ActorStateSchema validates the snapshot blob; Effect Schema Struct types are readonly while domain ActorState uses mutable arrays — shapes are otherwise identical.
  return decoded as ActorState
}

export function hashActorState(state: ActorState): string {
  const json = JSON.stringify(state)
  return bytesToHex(sha256(new TextEncoder().encode(json))).slice(0, 16)
}

function actorStateToJsonValue(state: ActorState): JsonValue {
  const raw: unknown = JSON.parse(JSON.stringify(state))
  return Schema.decodeUnknownSync(JsonValueSchema)(raw)
}

export function shouldTakeSnapshot(
  events: LoomsEvent[],
  every: number = DEFAULT_SNAPSHOT_EVERY,
): boolean {
  const durable = events.filter((e) => !e.ephemeral && e.type !== 'snapshot.taken')
  if (durable.length === 0) return false
  let lastSnap: LoomsEvent | undefined
  for (let i = events.length - 1; i >= 0; i--) {
    const candidate = events[i]
    if (candidate?.type === 'snapshot.taken') {
      lastSnap = candidate
      break
    }
  }
  const since = lastSnap
    ? durable.filter((e) => e.seq > lastSnap.seq).length
    : durable.length
  return since >= every
}

/**
 * Build a `snapshot.taken` event for the current reduced state.
 * Clients / hosts can truncate history before this seq on cold start.
 */
export function buildSnapshotEvent(
  actorId: string,
  events: LoomsEvent[],
  options?: { includeState?: boolean },
): TypedLoomsEvent<'snapshot.taken'> {
  const state = reduceActor(events, { actorId })
  const last = events[events.length - 1]
  const payload: SnapshotTakenPayload = {
    seq: last?.seq ?? 0,
    stateHash: hashActorState(state),
  }
  if (options?.includeState) {
    payload.state = actorStateToJsonValue(state)
  }
  return event('snapshot.taken', actorId, payload)
}

/**
 * Hydrate from the latest snapshot (if any) + trailing events.
 * When the snapshot carries an embedded state blob, only events after
 * `payload.seq` are folded on top — otherwise the full log is reduced.
 */
export function reduceFromSnapshots(
  events: LoomsEvent[],
  options?: { actorId?: string },
): ActorState {
  const actorId = options?.actorId ?? events[0]?.actorId ?? 'unknown'
  let latestSnapIdx = -1
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]?.type === 'snapshot.taken') {
      latestSnapIdx = i
      break
    }
  }
  if (latestSnapIdx < 0) {
    return reduceActor(events, { actorId })
  }
  const snap = events[latestSnapIdx]!
  const payload = Schema.decodeUnknownSync(SnapshotTakenPayloadSchema)(snap.payload)
  if (payload.state !== undefined) {
    // Re-fold trailing events after the snapshot for correctness
    const trailing = events.filter((e) => e.seq > payload.seq)
    if (trailing.length === 0) {
      return decodeActorState(payload.state)
    }
    // Without a typed restore path for partial folds, fall back to full reduce (safe).
    return reduceActor(events, { actorId })
  }
  return reduceActor(events, { actorId })
}
