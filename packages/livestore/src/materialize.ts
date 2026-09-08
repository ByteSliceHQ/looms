import {
  fromWireEvent,
  payloadAsJson,
  reduceActor,
  type EventPayloadMap,
  type EventType,
  type LoomsEvent,
} from '@looms/core'
import {
  emptyTables,
  type ActorRow,
  type EventRow,
  type MaterializedTables,
  type MessageRow,
  type NodeRow,
  type ReviewRow,
  type TurnRow,
} from './tables'

function payloadOf<T extends EventType>(event: LoomsEvent & { type: T }): EventPayloadMap[T] {
  // SAFETY: callers pass events after `case T:` narrowing; generic Extract does not refine `.payload`.
  return event.payload as EventPayloadMap[T]
}

function turnKey(actorId: string, turn: number): string {
  return `${actorId}:${turn}`
}

function nodeKey(actorId: string, nodeId: string): string {
  return `${actorId}:${nodeId}`
}

function upsertActor(tables: MaterializedTables, patch: Partial<ActorRow> & { actorId: string }): void {
  const existing = tables.actors.get(patch.actorId)
  tables.actors.set(patch.actorId, {
    actorId: patch.actorId,
    kind: patch.kind ?? existing?.kind ?? null,
    status: patch.status ?? existing?.status ?? null,
    definitionName: patch.definitionName ?? existing?.definitionName ?? null,
    parentActorId:
      patch.parentActorId !== undefined ? patch.parentActorId : (existing?.parentActorId ?? null),
    input: patch.input !== undefined ? patch.input : (existing?.input ?? null),
    output: patch.output !== undefined ? patch.output : (existing?.output ?? null),
    error: patch.error !== undefined ? patch.error : (existing?.error ?? null),
    updatedAt: patch.updatedAt ?? existing?.updatedAt ?? Date.now(),
  })
}

/**
 * Pure materializer: fold LoomsEvent[] into queryable in-memory tables.
 * Prefer {@link materializeActor} when reducing a single actor log.
 */
export function materializeEvents(
  events: LoomsEvent[],
  seed: MaterializedTables = emptyTables(),
): MaterializedTables {
  const tables: MaterializedTables = {
    actors: new Map(seed.actors),
    messages: [...seed.messages],
    turns: new Map(seed.turns),
    nodes: new Map(seed.nodes),
    reviews: new Map(seed.reviews),
    events: [...seed.events],
  }

  const seen = new Set(tables.events.map((e) => e.id))

  for (const evt of events) {
    if (seen.has(evt.id)) continue
    seen.add(evt.id)

    const eventRow: EventRow = {
      id: evt.id,
      actorId: evt.actorId,
      type: evt.type,
      seq: evt.seq,
      ts: evt.ts,
      ephemeral: evt.ephemeral ?? false,
      parentActorId: evt.parentActorId ?? null,
      payload: payloadAsJson(evt.payload),
    }
    tables.events.push(eventRow)
    if (evt.ephemeral) continue

    switch (evt.type) {
      case 'actor.started': {
        const p = payloadOf<'actor.started'>(evt)
        upsertActor(tables, {
          actorId: evt.actorId,
          kind: p.kind,
          status: 'running',
          definitionName: p.definitionName,
          parentActorId: p.parentActorId,
          input: p.input,
          updatedAt: evt.ts,
        })
        if (p.nodeIds) {
          for (const nodeId of p.nodeIds) {
            tables.nodes.set(nodeKey(evt.actorId, nodeId), {
              actorId: evt.actorId,
              nodeId,
              status: 'pending',
              result: null,
              error: null,
              reviewId: null,
              updatedAt: evt.ts,
            })
          }
        }
        break
      }
      case 'actor.completed': {
        const p = payloadOf<'actor.completed'>(evt)
        upsertActor(tables, {
          actorId: evt.actorId,
          status: 'completed',
          output: p.output,
          error: null,
          updatedAt: evt.ts,
        })
        break
      }
      case 'actor.failed': {
        const p = payloadOf<'actor.failed'>(evt)
        upsertActor(tables, {
          actorId: evt.actorId,
          status: 'failed',
          error: p.error,
          updatedAt: evt.ts,
        })
        break
      }
      case 'actor.cancelled': {
        upsertActor(tables, {
          actorId: evt.actorId,
          status: 'cancelled',
          updatedAt: evt.ts,
        })
        break
      }
      case 'agent.message.received': {
        const p = payloadOf<'agent.message.received'>(evt)
        const row: MessageRow = {
          id: `${evt.id}:msg`,
          actorId: evt.actorId,
          seq: evt.seq,
          role: p.message.role,
          content: p.message.content,
          toolCallId: p.message.toolCallId ?? null,
          name: p.message.name ?? null,
          turn: null,
          ts: evt.ts,
        }
        tables.messages.push(row)
        break
      }
      case 'agent.message': {
        const p = payloadOf<'agent.message'>(evt)
        tables.messages.push({
          id: `${evt.id}:msg`,
          actorId: evt.actorId,
          seq: evt.seq,
          role: p.message.role,
          content: p.message.content,
          toolCallId: p.message.toolCallId ?? null,
          name: p.message.name ?? null,
          turn: p.turn,
          ts: evt.ts,
        })
        const key = turnKey(evt.actorId, p.turn)
        const existing = tables.turns.get(key)
        tables.turns.set(key, {
          actorId: evt.actorId,
          turn: p.turn,
          startedAt: existing?.startedAt ?? evt.ts,
          messageCount: (existing?.messageCount ?? 0) + 1,
        })
        break
      }
      case 'agent.turn.started': {
        const p = payloadOf<'agent.turn.started'>(evt)
        const key = turnKey(evt.actorId, p.turn)
        const existing = tables.turns.get(key)
        tables.turns.set(key, {
          actorId: evt.actorId,
          turn: p.turn,
          startedAt: existing?.startedAt ?? evt.ts,
          messageCount: existing?.messageCount ?? 0,
        })
        break
      }
      case 'tool.result': {
        const p = payloadOf<'tool.result'>(evt)
        tables.messages.push({
          id: `${evt.id}:tool`,
          actorId: evt.actorId,
          seq: evt.seq,
          role: 'tool',
          content: p.error ?? JSON.stringify(p.result ?? null),
          toolCallId: p.toolCallId,
          name: p.name,
          turn: p.turn,
          ts: evt.ts,
        })
        break
      }
      case 'workflow.node.started': {
        const p = payloadOf<'workflow.node.started'>(evt)
        const key = nodeKey(evt.actorId, p.nodeId)
        const existing = tables.nodes.get(key)
        tables.nodes.set(key, {
          actorId: evt.actorId,
          nodeId: p.nodeId,
          status: 'running',
          result: null,
          error: null,
          reviewId: existing?.reviewId ?? null,
          updatedAt: evt.ts,
        })
        break
      }
      case 'workflow.node.finished': {
        const p = payloadOf<'workflow.node.finished'>(evt)
        const key = nodeKey(evt.actorId, p.nodeId)
        const existing = tables.nodes.get(key)
        tables.nodes.set(key, {
          actorId: evt.actorId,
          nodeId: p.nodeId,
          status: p.error ? 'failed' : 'completed',
          result: p.result,
          error: p.error,
          reviewId: existing?.reviewId ?? null,
          updatedAt: evt.ts,
        })
        break
      }
      case 'workflow.node.skipped': {
        const p = payloadOf<'workflow.node.skipped'>(evt)
        tables.nodes.set(nodeKey(evt.actorId, p.nodeId), {
          actorId: evt.actorId,
          nodeId: p.nodeId,
          status: 'skipped',
          result: null,
          error: null,
          reviewId: null,
          updatedAt: evt.ts,
        })
        break
      }
      case 'review.requested': {
        const p = payloadOf<'review.requested'>(evt)
        const review: ReviewRow = {
          reviewId: p.reviewId,
          actorId: evt.actorId,
          title: p.title,
          description: p.description ?? null,
          status: 'pending',
          nodeId: p.nodeId ?? null,
          decision: null,
          updatedAt: evt.ts,
        }
        tables.reviews.set(p.reviewId, review)
        if (p.nodeId) {
          const key = nodeKey(evt.actorId, p.nodeId)
          const existing = tables.nodes.get(key)
          tables.nodes.set(key, {
            actorId: evt.actorId,
            nodeId: p.nodeId,
            status: 'waiting_review',
            result: existing?.result ?? null,
            error: existing?.error ?? null,
            reviewId: p.reviewId,
            updatedAt: evt.ts,
          })
        }
        upsertActor(tables, {
          actorId: evt.actorId,
          status: 'waiting_review',
          updatedAt: evt.ts,
        })
        break
      }
      case 'review.decided': {
        const p = payloadOf<'review.decided'>(evt)
        const existing = tables.reviews.get(p.reviewId)
        tables.reviews.set(p.reviewId, {
          reviewId: p.reviewId,
          actorId: evt.actorId,
          title: existing?.title ?? 'Review',
          description: existing?.description ?? null,
          status: p.outcome === 'approve' ? 'approved' : 'rejected',
          nodeId: existing?.nodeId ?? null,
          decision: p.payload ?? { actionId: p.actionId },
          updatedAt: evt.ts,
        })
        break
      }
      case 'review.timed_out': {
        const p = payloadOf<'review.timed_out'>(evt)
        const existing = tables.reviews.get(p.reviewId)
        if (existing) {
          tables.reviews.set(p.reviewId, {
            ...existing,
            status: 'timed_out',
            updatedAt: evt.ts,
          })
        }
        break
      }
      default:
        break
    }
  }

  // Align actor status / node / review maps with the authoritative reducer when possible.
  const byActor = new Map<string, LoomsEvent[]>()
  for (const evt of tables.events) {
    if (evt.ephemeral) continue
    const list = byActor.get(evt.actorId) ?? []
    list.push(
      fromWireEvent({
        id: evt.id,
        actorId: evt.actorId,
        type: evt.type,
        seq: evt.seq,
        ts: evt.ts,
        ephemeral: evt.ephemeral,
        parentActorId: evt.parentActorId,
        payload: evt.payload,
      }),
    )
    byActor.set(evt.actorId, list)
  }
  for (const [actorId, actorEvents] of byActor) {
    const state = reduceActor(actorEvents, { actorId })
    upsertActor(tables, {
      actorId,
      kind: state.kind,
      status: state.status,
      definitionName: state.definitionName,
      parentActorId: state.parentActorId,
      input: state.input,
      output: state.output,
      error: state.error,
      updatedAt: actorEvents[actorEvents.length - 1]?.ts ?? Date.now(),
    })
    if (state.kind === 'workflow') {
      for (const [nodeId, node] of Object.entries(state.nodes)) {
        tables.nodes.set(nodeKey(actorId, nodeId), {
          actorId,
          nodeId,
          status: node.status,
          result: node.result,
          error: node.error,
          reviewId: node.reviewId ?? null,
          updatedAt: actorEvents[actorEvents.length - 1]?.ts ?? Date.now(),
        })
      }
    }
    for (const [reviewId, review] of Object.entries(state.reviews)) {
      tables.reviews.set(reviewId, {
        reviewId,
        actorId,
        title: review.title,
        description: review.description ?? null,
        status: review.status,
        nodeId: review.nodeId ?? null,
        decision: review.decision ?? null,
        updatedAt: actorEvents[actorEvents.length - 1]?.ts ?? Date.now(),
      })
    }
  }

  tables.events.sort((a, b) => a.seq - b.seq || a.ts - b.ts)
  tables.messages.sort((a, b) => a.seq - b.seq)

  return tables
}

/**
 * Materialize a single actor's event log into tables + reduced ActorState-compatible views.
 */
export function materializeActor(events: LoomsEvent[]): MaterializedTables {
  return materializeEvents(events)
}

export type { TurnRow, NodeRow, ReviewRow, MessageRow, ActorRow, EventRow }
