import type { QueryBuilder } from '@livestore/common'
import { Events, makeSchema, Schema, State } from '@livestore/livestore'
import type { JsonValue, Message } from '@looms/core'
import { Predicate } from 'effect'
import { type LoomsEventName } from './event-names'

export const LoomsEnvelope = Schema.Struct({
  id: Schema.String,
  actorId: Schema.optional(Schema.String),
  ts: Schema.Number,
  ephemeral: Schema.optional(Schema.Boolean),
  parentActorId: Schema.optional(Schema.NullOr(Schema.String)),
  payload: Schema.optional(Schema.Unknown),
})

export interface LoomsEnvelope {
  readonly id: string
  readonly actorId?: string | undefined
  readonly ts: number
  readonly ephemeral?: boolean | undefined
  readonly parentActorId?: string | null | undefined
  readonly payload?: JsonValue | undefined
}

function makeLoomsEvent(name: LoomsEventName) {
  return Events.synced({
    name,
    schema: LoomsEnvelope,
  })
}

export const events = {
  actorStarted: makeLoomsEvent('actor.started'),
  actorCompleted: makeLoomsEvent('actor.completed'),
  actorFailed: makeLoomsEvent('actor.failed'),
  actorCancelled: makeLoomsEvent('actor.cancelled'),
  agentMessageReceived: makeLoomsEvent('agent.message.received'),
  agentTurnStarted: makeLoomsEvent('agent.turn.started'),
  agentTurnTextDelta: makeLoomsEvent('agent.turn.text_delta'),
  agentTurnSteered: makeLoomsEvent('agent.turn.steered'),
  agentMessage: makeLoomsEvent('agent.message'),
  agentToolCallRequested: makeLoomsEvent('agent.tool_call.requested'),
  toolResult: makeLoomsEvent('tool.result'),
  childSpawned: makeLoomsEvent('child.spawned'),
  childCompleted: makeLoomsEvent('child.completed'),
  workflowNodeStarted: makeLoomsEvent('workflow.node.started'),
  workflowNodeFinished: makeLoomsEvent('workflow.node.finished'),
  workflowNodeSkipped: makeLoomsEvent('workflow.node.skipped'),
  reviewRequested: makeLoomsEvent('review.requested'),
  reviewDecided: makeLoomsEvent('review.decided'),
  reviewTimedOut: makeLoomsEvent('review.timed_out'),
  timerSet: makeLoomsEvent('timer.set'),
  timerFired: makeLoomsEvent('timer.fired'),
  snapshotTaken: makeLoomsEvent('snapshot.taken'),
}

/** LiveStore event name → `events` key (for coverage tests). */
export const LIVE_STORE_EVENT_KEYS = {
  'actor.started': 'actorStarted',
  'actor.completed': 'actorCompleted',
  'actor.failed': 'actorFailed',
  'actor.cancelled': 'actorCancelled',
  'agent.message.received': 'agentMessageReceived',
  'agent.turn.started': 'agentTurnStarted',
  'agent.turn.text_delta': 'agentTurnTextDelta',
  'agent.turn.steered': 'agentTurnSteered',
  'agent.message': 'agentMessage',
  'agent.tool_call.requested': 'agentToolCallRequested',
  'tool.result': 'toolResult',
  'child.spawned': 'childSpawned',
  'child.completed': 'childCompleted',
  'workflow.node.started': 'workflowNodeStarted',
  'workflow.node.finished': 'workflowNodeFinished',
  'workflow.node.skipped': 'workflowNodeSkipped',
  'review.requested': 'reviewRequested',
  'review.decided': 'reviewDecided',
  'review.timed_out': 'reviewTimedOut',
  'timer.set': 'timerSet',
  'timer.fired': 'timerFired',
  'snapshot.taken': 'snapshotTaken',
} as const satisfies Record<LoomsEventName, keyof typeof events>

export const tables = {
  actors: State.SQLite.table({
    name: 'actors',
    columns: {
      actorId: State.SQLite.text({ primaryKey: true }),
      kind: State.SQLite.text({ nullable: true }),
      status: State.SQLite.text({ nullable: true }),
      definitionName: State.SQLite.text({ nullable: true }),
      parentActorId: State.SQLite.text({ nullable: true }),
      inputJson: State.SQLite.text({ nullable: true }),
      outputJson: State.SQLite.text({ nullable: true }),
      error: State.SQLite.text({ nullable: true }),
      updatedAt: State.SQLite.integer({ nullable: false }),
    },
  }),
  messages: State.SQLite.table({
    name: 'messages',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      actorId: State.SQLite.text({ nullable: false }),
      seq: State.SQLite.integer({ nullable: false }),
      role: State.SQLite.text({ nullable: false }),
      content: State.SQLite.text({ nullable: false }),
      toolCallId: State.SQLite.text({ nullable: true }),
      name: State.SQLite.text({ nullable: true }),
      turn: State.SQLite.integer({ nullable: true }),
      ts: State.SQLite.integer({ nullable: false }),
    },
  }),
  nodes: State.SQLite.table({
    name: 'nodes',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      actorId: State.SQLite.text({ nullable: false }),
      nodeId: State.SQLite.text({ nullable: false }),
      status: State.SQLite.text({ nullable: false }),
      resultJson: State.SQLite.text({ nullable: true }),
      error: State.SQLite.text({ nullable: true }),
      reviewId: State.SQLite.text({ nullable: true }),
      updatedAt: State.SQLite.integer({ nullable: false }),
    },
  }),
  reviews: State.SQLite.table({
    name: 'reviews',
    columns: {
      reviewId: State.SQLite.text({ primaryKey: true }),
      actorId: State.SQLite.text({ nullable: false }),
      title: State.SQLite.text({ nullable: false }),
      description: State.SQLite.text({ nullable: true }),
      status: State.SQLite.text({ nullable: false }),
      nodeId: State.SQLite.text({ nullable: true }),
      decisionJson: State.SQLite.text({ nullable: true }),
      updatedAt: State.SQLite.integer({ nullable: false }),
    },
  }),
  eventsLog: State.SQLite.table({
    name: 'events_log',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      actorId: State.SQLite.text({ nullable: false }),
      type: State.SQLite.text({ nullable: false }),
      seq: State.SQLite.integer({ nullable: false }),
      ts: State.SQLite.integer({ nullable: false }),
      ephemeral: State.SQLite.integer({ nullable: false }),
      parentActorId: State.SQLite.text({ nullable: true }),
      payloadJson: State.SQLite.text({ nullable: false }),
    },
  }),
  children: State.SQLite.table({
    name: 'children',
    columns: {
      childActorId: State.SQLite.text({ primaryKey: true }),
      parentActorId: State.SQLite.text({ nullable: false }),
      kind: State.SQLite.text({ nullable: true }),
      definitionName: State.SQLite.text({ nullable: true }),
      status: State.SQLite.text({ nullable: false }),
      toolCallId: State.SQLite.text({ nullable: true }),
      nodeId: State.SQLite.text({ nullable: true }),
      inputJson: State.SQLite.text({ nullable: true }),
      outputJson: State.SQLite.text({ nullable: true }),
      error: State.SQLite.text({ nullable: true }),
      updatedAt: State.SQLite.integer({ nullable: false }),
    },
  }),
}

export type ActorRow = typeof tables.actors.Type
export type MessageRow = typeof tables.messages.Type
export type NodeRow = typeof tables.nodes.Type
export type ReviewRow = typeof tables.reviews.Type
export type EventLogRow = typeof tables.eventsLog.Type
export type ChildRow = typeof tables.children.Type

function json(value: JsonValue | undefined): string {
  return JSON.stringify(value ?? null)
}

function asRecord(payload: JsonValue | undefined): Record<string, JsonValue> {
  if (payload && Predicate.isReadonlyObject(payload) && !Array.isArray(payload)) {
    // SAFETY: payload verified to be an object and not an array.
    return payload as Record<string, JsonValue>
  }
  return {}
}

type DbOp = QueryBuilder.Any

interface MaterializerContext {
  readonly event: {
    readonly seqNum: {
      readonly global: number
    }
  }
  readonly query: (qb: any) => any
}

function resolveActorId(env: LoomsEnvelope, context: MaterializerContext): string {
  if (env.actorId) return env.actorId
  const first = context.query(tables.actors.select().first())
  return first?.actorId ?? 'unknown'
}

function insertEventLog(
  env: LoomsEnvelope,
  type: string,
  seq: number,
  actorId: string,
): DbOp {
  return tables.eventsLog.insert({
    id: env.id,
    actorId,
    type,
    seq,
    ts: env.ts,
    ephemeral: env.ephemeral ? 1 : 0,
    parentActorId: env.parentActorId ?? null,
    payloadJson: json(env.payload),
  })
}

function upsertActor(
  env: LoomsEnvelope,
  actorId: string,
  patch: {
    kind?: string | null
    status?: string | null
    definitionName?: string | null
    parentActorId?: string | null
    inputJson?: string | null
    outputJson?: string | null
    error?: string | null
  },
): DbOp {
  return tables.actors
    .insert({
      actorId,
      kind: patch.kind ?? null,
      status: patch.status ?? null,
      definitionName: patch.definitionName ?? null,
      parentActorId: patch.parentActorId ?? null,
      inputJson: patch.inputJson ?? null,
      outputJson: patch.outputJson ?? null,
      error: patch.error ?? null,
      updatedAt: env.ts,
    })
    .onConflict('actorId', 'replace')
}

function materialize(
  type: LoomsEventName,
  fn: (env: LoomsEnvelope, context: MaterializerContext) => DbOp | DbOp[],
) {
  // SAFETY: LiveStore passes decoded events conforming to LoomsEnvelope.
  return [type, (env: LoomsEnvelope, context: MaterializerContext) => fn(env, context)] as const
}

const materializerEntries = [
  materialize('actor.started', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const p = asRecord(env.payload)
    const actorId = resolveActorId(env, ctx)
    const ops: DbOp[] = [
      insertEventLog(env, 'actor.started', seq, actorId),
      upsertActor(env, actorId, {
        kind: Predicate.isString(p.kind) ? p.kind : null,
        status: 'running',
        definitionName: Predicate.isString(p.definitionName) ? p.definitionName : null,
        parentActorId: Predicate.isString(p.parentActorId) ? p.parentActorId : null,
        inputJson: json(p.input ?? null),
      }),
    ]
    const nodeIds = Array.isArray(p.nodeIds) ? p.nodeIds : []
    for (const nodeId of nodeIds) {
      if (!Predicate.isString(nodeId)) continue
      // SAFETY: table insert returns QueryBuilder.Any.
      ops.push(
        tables.nodes
          .insert({
            id: `${actorId}:${nodeId}`,
            actorId,
            nodeId,
            status: 'pending',
            resultJson: null,
            error: null,
            reviewId: null,
            updatedAt: env.ts,
          })
          .onConflict('id', 'replace'),
      )
    }
    return ops
  }),
  materialize('actor.completed', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    return [
      insertEventLog(env, 'actor.completed', seq, actorId),
      upsertActor(env, actorId, {
        status: 'completed',
        outputJson: json(p.output ?? null),
        error: null,
      }),
    ]
  }),
  materialize('actor.failed', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    return [
      insertEventLog(env, 'actor.failed', seq, actorId),
      upsertActor(env, actorId, {
        status: 'failed',
        error: Predicate.isString(p.error) ? p.error : json(p.error ?? null),
      }),
    ]
  }),
  materialize('actor.cancelled', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    return [
      insertEventLog(env, 'actor.cancelled', seq, actorId),
      upsertActor(env, actorId, { status: 'cancelled' }),
    ]
  }),
  materialize('agent.message.received', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const message = asRecord(p.message ?? null)
    return [
      insertEventLog(env, 'agent.message.received', seq, actorId),
      tables.messages
        .insert({
          id: `${env.id}:msg`,
          actorId,
          seq,
          role: Predicate.isString(message.role) ? message.role : 'user',
          content: Predicate.isString(message.content) ? message.content : '',
          toolCallId: Predicate.isString(message.toolCallId) ? message.toolCallId : null,
          name: Predicate.isString(message.name) ? message.name : null,
          turn: null,
          ts: env.ts,
        })
        .onConflict('id', 'replace'),
    ]
  }),
  materialize('agent.turn.started', (env, ctx) => [
    insertEventLog(env, 'agent.turn.started', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
  materialize('agent.turn.text_delta', (env, ctx) => [
    insertEventLog(env, 'agent.turn.text_delta', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
  materialize('agent.turn.steered', (env, ctx) => [
    insertEventLog(env, 'agent.turn.steered', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
  materialize('agent.message', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const message = asRecord(p.message ?? null)
    return [
      insertEventLog(env, 'agent.message', seq, actorId),
      tables.messages
        .insert({
          id: `${env.id}:msg`,
          actorId,
          seq,
          role: Predicate.isString(message.role) ? message.role : 'assistant',
          content: Predicate.isString(message.content) ? message.content : '',
          toolCallId: Predicate.isString(message.toolCallId) ? message.toolCallId : null,
          name: Predicate.isString(message.name) ? message.name : null,
          turn: Predicate.isNumber(p.turn) ? p.turn : null,
          ts: env.ts,
        })
        .onConflict('id', 'replace'),
    ]
  }),
  materialize('agent.tool_call.requested', (env, ctx) => [
    insertEventLog(env, 'agent.tool_call.requested', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
  materialize('tool.result', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    return [
      insertEventLog(env, 'tool.result', seq, actorId),
      tables.messages
        .insert({
          id: `${env.id}:tool`,
          actorId,
          seq,
          role: 'tool',
          content: Predicate.isString(p.error) ? p.error : JSON.stringify(p.result ?? null),
          toolCallId: Predicate.isString(p.toolCallId) ? p.toolCallId : null,
          name: Predicate.isString(p.name) ? p.name : null,
          turn: Predicate.isNumber(p.turn) ? p.turn : null,
          ts: env.ts,
        })
        .onConflict('id', 'replace'),
    ]
  }),
  materialize('child.spawned', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const childActorId = Predicate.isString(p.childActorId) ? p.childActorId : null
    const ops: DbOp[] = [
      insertEventLog(env, 'child.spawned', seq, actorId),
      upsertActor(env, actorId, { status: 'waiting_child' }),
    ]
    if (childActorId) {
      ops.push(
        tables.children
          .insert({
            childActorId,
            parentActorId: actorId,
            kind: Predicate.isString(p.childKind) ? p.childKind : null,
            definitionName: Predicate.isString(p.childDefinitionName)
              ? p.childDefinitionName
              : null,
            status: 'running',
            toolCallId: Predicate.isString(p.toolCallId) ? p.toolCallId : null,
            nodeId: Predicate.isString(p.nodeId) ? p.nodeId : null,
            inputJson: json(p.input ?? null),
            outputJson: null,
            error: null,
            updatedAt: env.ts,
          })
          .onConflict('childActorId', 'replace'),
      )
    }
    return ops
  }),
  materialize('child.completed', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const childActorId = Predicate.isString(p.childActorId) ? p.childActorId : null
    const failed = p.error != null && p.error !== ''
    const ops: DbOp[] = [insertEventLog(env, 'child.completed', seq, actorId)]
    if (childActorId) {
      ops.push(
        tables.children
          .update({
            status: failed ? 'failed' : 'completed',
            outputJson: json(p.result ?? null),
            error: Predicate.isString(p.error)
              ? p.error
              : p.error
                ? json(p.error)
                : null,
            updatedAt: env.ts,
          })
          .where({ childActorId }),
      )
    }
    return ops
  }),
  materialize('workflow.node.started', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const nodeId = Predicate.isString(p.nodeId) ? p.nodeId : 'unknown'
    return [
      insertEventLog(env, 'workflow.node.started', seq, actorId),
      tables.nodes
        .insert({
          id: `${actorId}:${nodeId}`,
          actorId,
          nodeId,
          status: 'running',
          resultJson: null,
          error: null,
          reviewId: null,
          updatedAt: env.ts,
        })
        .onConflict('id', 'replace'),
    ]
  }),
  materialize('workflow.node.finished', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const nodeId = Predicate.isString(p.nodeId) ? p.nodeId : 'unknown'
    return [
      insertEventLog(env, 'workflow.node.finished', seq, actorId),
      tables.nodes
        .insert({
          id: `${actorId}:${nodeId}`,
          actorId,
          nodeId,
          status: p.error ? 'failed' : 'completed',
          resultJson: json(p.result ?? null),
          error: Predicate.isString(p.error)
            ? p.error
            : p.error
              ? json(p.error)
              : null,
          reviewId: null,
          updatedAt: env.ts,
        })
        .onConflict('id', 'replace'),
    ]
  }),
  materialize('workflow.node.skipped', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const nodeId = Predicate.isString(p.nodeId) ? p.nodeId : 'unknown'
    return [
      insertEventLog(env, 'workflow.node.skipped', seq, actorId),
      tables.nodes
        .insert({
          id: `${actorId}:${nodeId}`,
          actorId,
          nodeId,
          status: 'skipped',
          resultJson: null,
          error: null,
          reviewId: null,
          updatedAt: env.ts,
        })
        .onConflict('id', 'replace'),
    ]
  }),
  materialize('review.requested', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const reviewId = Predicate.isString(p.reviewId) ? p.reviewId : env.id
    const nodeId = Predicate.isString(p.nodeId) ? p.nodeId : null
    const ops: DbOp[] = [
      insertEventLog(env, 'review.requested', seq, actorId),
      tables.reviews
        .insert({
          reviewId,
          actorId,
          title: Predicate.isString(p.title) ? p.title : 'Review',
          description: Predicate.isString(p.description) ? p.description : null,
          status: 'pending',
          nodeId,
          decisionJson: null,
          updatedAt: env.ts,
        })
        .onConflict('reviewId', 'replace'),
      upsertActor(env, actorId, { status: 'waiting_review' }),
    ]
    if (nodeId) {
      ops.push(
        tables.nodes
          .insert({
            id: `${actorId}:${nodeId}`,
            actorId,
            nodeId,
            status: 'waiting_review',
            resultJson: null,
            error: null,
            reviewId,
            updatedAt: env.ts,
          })
          .onConflict('id', 'replace'),
      )
    }
    return ops
  }),
  materialize('review.decided', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const reviewId = Predicate.isString(p.reviewId) ? p.reviewId : env.id
    const outcome = p.outcome === 'reject' ? 'rejected' : 'approved'
    return [
      insertEventLog(env, 'review.decided', seq, actorId),
      tables.reviews
        .insert({
          reviewId,
          actorId,
          title: 'Review',
          description: null,
          status: outcome,
          nodeId: null,
          decisionJson: json({
            actionId: p.actionId ?? null,
            outcome: p.outcome ?? null,
            payload: p.payload ?? null,
          }),
          updatedAt: env.ts,
        })
        .onConflict('reviewId', 'replace'),
    ]
  }),
  materialize('review.timed_out', (env, ctx) => {
    const seq = ctx.event.seqNum.global
    const actorId = resolveActorId(env, ctx)
    const p = asRecord(env.payload)
    const reviewId = Predicate.isString(p.reviewId) ? p.reviewId : env.id
    return [
      insertEventLog(env, 'review.timed_out', seq, actorId),
      tables.reviews
        .insert({
          reviewId,
          actorId,
          title: 'Review',
          description: null,
          status: 'timed_out',
          nodeId: null,
          decisionJson: null,
          updatedAt: env.ts,
        })
        .onConflict('reviewId', 'replace'),
    ]
  }),
  materialize('timer.set', (env, ctx) => [
    insertEventLog(env, 'timer.set', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
  materialize('timer.fired', (env, ctx) => [
    insertEventLog(env, 'timer.fired', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
  materialize('snapshot.taken', (env, ctx) => [
    insertEventLog(env, 'snapshot.taken', ctx.event.seqNum.global, resolveActorId(env, ctx)),
  ]),
]

const materializers = State.SQLite.materializers(
  events,
  // SAFETY: materializer entries map strictly to defined events.
  Object.fromEntries(materializerEntries) as never,
)

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })

export function sendMessage(
  store: { readonly storeId: string; commit(event: any): void },
  message: string | Message,
): void {
  const msg: Message = Predicate.isString(message)
    ? { role: 'user', content: message }
    : message
  store.commit(
    events.agentMessageReceived({
      id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      actorId: store.storeId,
      ts: Date.now(),
      payload: { message: msg },
    }),
  )
}

export function decideReview(
  store: { readonly storeId: string; commit(event: any): void },
  decision: {
    readonly reviewId: string
    readonly outcome: 'approve' | 'reject'
    readonly actionId?: string
    readonly payload?: JsonValue
  },
): void {
  store.commit(
    events.reviewDecided({
      id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      actorId: store.storeId,
      ts: Date.now(),
      payload: {
        reviewId: decision.reviewId,
        actionId: decision.actionId ?? decision.outcome,
        outcome: decision.outcome,
        payload: decision.payload,
      },
    }),
  )
}
