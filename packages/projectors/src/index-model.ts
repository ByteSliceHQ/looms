import type { EventEnvelope, JsonValue } from '@looms/core'
import { Predicate } from 'effect'
import type { Projector } from './projector'

export interface ActorIndexRow {
  actorId: string
  kind: string | null
  status: string | null
  definitionName: string | null
  parentActorId: string | null
  updatedAt: number
}

export interface ReviewIndexRow {
  reviewId: string
  actorId: string
  status: string
  title: string
  updatedAt: number
}

export type IndexOp =
  | {
      type: 'upsertActor'
      actorId: string
      kind: string | null
      status: string | null
      definitionName: string | null
      parentActorId: string | null
      updatedAt: number
    }
  | {
      type: 'setActorStatus'
      actorId: string
      status: string
      updatedAt: number
    }
  | {
      type: 'upsertReview'
      reviewId: string
      actorId: string
      status: string
      title: string
      updatedAt: number
    }
  | {
      type: 'setReviewStatus'
      reviewId: string
      status: string
      updatedAt: number
    }

export interface IndexBackend {
  applyOps: (ops: ReadonlyArray<IndexOp>) => Promise<void>
  getActor: (actorId: string) => Promise<ActorIndexRow | null>
  listReviews: (actorId?: string) => Promise<ReviewIndexRow[]>
  init?: () => Promise<void>
  dispose?: () => Promise<void>
}

export interface IndexProjector extends Projector {
  getActor: (actorId: string) => Promise<ActorIndexRow | null>
  listReviews: (actorId?: string) => Promise<ReviewIndexRow[]>
}

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  if (!Predicate.isObject(event.payload)) return {}
  return event.payload
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

export function indexOpsFor(event: EventEnvelope): IndexOp[] {
  const payload = payloadObject(event)
  switch (event.type) {
    case 'runtime.run.started':
      return [
        {
          type: 'upsertActor',
          actorId: event.runId,
          kind: readString(payload, 'kind') ?? null,
          status: 'running',
          definitionName: readString(payload, 'definitionName') ?? null,
          parentActorId: null,
          updatedAt: event.ts,
        },
      ]
    case 'runtime.thread.started':
      return [
        {
          type: 'upsertActor',
          actorId:
            readString(payload, 'threadId') ??
            event.threadId ??
            event.runId,
          kind: readString(payload, 'kind') ?? null,
          status: 'running',
          definitionName: readString(payload, 'definitionName') ?? null,
          parentActorId:
            readString(payload, 'parentThreadId') ?? null,
          updatedAt: event.ts,
        },
      ]
    case 'runtime.run.completed':
    case 'runtime.thread.completed':
      return [
        {
          type: 'setActorStatus',
          actorId: readString(payload, 'threadId') ?? event.threadId ?? event.runId,
          status: 'completed',
          updatedAt: event.ts,
        },
      ]
    case 'runtime.thread.failed':
      return [
        {
          type: 'setActorStatus',
          actorId: readString(payload, 'threadId') ?? event.threadId ?? event.runId,
          status: 'failed',
          updatedAt: event.ts,
        },
      ]
    case 'runtime.thread.cancelled':
      return [
        {
          type: 'setActorStatus',
          actorId: readString(payload, 'threadId') ?? event.threadId ?? event.runId,
          status: 'cancelled',
          updatedAt: event.ts,
        },
      ]
    case 'approval.requested':
      return [
        {
          type: 'upsertReview',
          reviewId: readString(payload, 'approvalId') ?? 'unknown',
          actorId: event.runId,
          status: 'pending',
          title: readString(payload, 'title') ?? 'Approval',
          updatedAt: event.ts,
        },
      ]
    case 'approval.decided':
      return [
        {
          type: 'upsertReview',
          reviewId: readString(payload, 'approvalId') ?? 'unknown',
          actorId: event.runId,
          status: payload.outcome === 'reject' ? 'rejected' : 'approved',
          title: 'Approval',
          updatedAt: event.ts,
        },
      ]
    case 'approval.timed_out':
      return [
        {
          type: 'setReviewStatus',
          reviewId: readString(payload, 'approvalId') ?? 'unknown',
          status: 'timed_out',
          updatedAt: event.ts,
        },
      ]
    default:
      return []
  }
}

export function createIndexProjector(name: string, backend: IndexBackend): IndexProjector {
  return {
    name,
    init: backend.init,
    dispose: backend.dispose,
    project: async (events) => {
      const ops = events.flatMap(indexOpsFor)
      if (ops.length === 0) return
      await backend.applyOps(ops)
    },
    getActor: (actorId) => backend.getActor(actorId),
    listReviews: (actorId) => backend.listReviews(actorId),
  }
}
