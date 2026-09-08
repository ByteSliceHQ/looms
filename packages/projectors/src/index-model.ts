import type { LoomsEvent } from '@looms/core'
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

export function indexOpsFor(event: LoomsEvent): IndexOp[] {
  switch (event.type) {
    case 'actor.started':
      return [
        {
          type: 'upsertActor',
          actorId: event.actorId,
          kind: event.payload.kind,
          status: 'running',
          definitionName: event.payload.definitionName,
          parentActorId: event.payload.parentActorId,
          updatedAt: event.ts,
        },
      ]
    case 'actor.completed':
      return [
        {
          type: 'setActorStatus',
          actorId: event.actorId,
          status: 'completed',
          updatedAt: event.ts,
        },
      ]
    case 'actor.failed':
      return [
        {
          type: 'setActorStatus',
          actorId: event.actorId,
          status: 'failed',
          updatedAt: event.ts,
        },
      ]
    case 'actor.cancelled':
      return [
        {
          type: 'setActorStatus',
          actorId: event.actorId,
          status: 'cancelled',
          updatedAt: event.ts,
        },
      ]
    case 'review.requested':
      return [
        {
          type: 'setActorStatus',
          actorId: event.actorId,
          status: 'waiting_review',
          updatedAt: event.ts,
        },
        {
          type: 'upsertReview',
          reviewId: event.payload.reviewId,
          actorId: event.actorId,
          status: 'pending',
          title: event.payload.title,
          updatedAt: event.ts,
        },
      ]
    case 'review.decided':
      return [
        {
          type: 'upsertReview',
          reviewId: event.payload.reviewId,
          actorId: event.actorId,
          status: event.payload.outcome === 'approve' ? 'approved' : 'rejected',
          title: 'Review',
          updatedAt: event.ts,
        },
      ]
    case 'review.timed_out':
      return [
        {
          type: 'setReviewStatus',
          reviewId: event.payload.reviewId,
          status: 'timed_out',
          updatedAt: event.ts,
        },
      ]
    case 'agent.message.received':
    case 'agent.turn.started':
    case 'agent.turn.text_delta':
    case 'agent.turn.steered':
    case 'agent.message':
    case 'agent.tool_call.requested':
    case 'tool.result':
    case 'child.spawned':
    case 'child.completed':
    case 'workflow.node.started':
    case 'workflow.node.finished':
    case 'workflow.node.skipped':
    case 'timer.set':
    case 'timer.fired':
    case 'snapshot.taken':
      return []
    default: {
      const _exhaustive: never = event
      return _exhaustive
    }
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
