import { Predicate } from 'effect'

import {
  completedRunStatus,
  readRunLaunchSource,
  type EventEnvelope,
  type JsonValue,
} from '@looms/core'

import type { Projector } from './projector'

/** A run (`actorId === runId`) or one of its threads. Thread ids are unique within a run. */
export interface ActorIndexRow {
  runId: string
  actorId: string
  kind: string | null
  status: string | null
  definitionName: string | null
  parentActorId: string | null
  /** On a run row: the run whose effect launched this one. */
  launchedByRunId: string | null
  /** On a run row: the effect, in `launchedByRunId`, that launched this one. */
  launchedByEffectId: string | null
  /** On a run row: the root run of its launch chain. */
  correlationId: string | null
  updatedAt: number
}

export interface ReviewIndexRow {
  runId: string
  reviewId: string
  status: string
  title: string
  updatedAt: number
}

export type IndexOp =
  | {
      type: 'upsertActor'
      runId: string
      actorId: string
      kind: string | null
      status: string | null
      definitionName: string | null
      parentActorId: string | null
      launchedByRunId: string | null
      launchedByEffectId: string | null
      correlationId: string | null
      updatedAt: number
    }
  | {
      type: 'setActorStatus'
      runId: string
      actorId: string
      status: string
      updatedAt: number
    }
  | {
      type: 'upsertReview'
      runId: string
      reviewId: string
      status: string
      title: string
      updatedAt: number
    }
  | {
      type: 'setReviewStatus'
      runId: string
      reviewId: string
      status: string
      updatedAt: number
    }

export interface IndexBackend {
  applyOps: (ops: ReadonlyArray<IndexOp>) => Promise<void>
  getActor: (runId: string, actorId: string) => Promise<ActorIndexRow | null>
  listLaunched: (runId: string) => Promise<ActorIndexRow[]>
  listReviews: (runId?: string) => Promise<ReviewIndexRow[]>
  init?: () => Promise<void>
  dispose?: () => Promise<void>
}

export interface IndexProjector extends Projector {
  /** The run's row, or one of its threads when `actorId` is given. */
  getActor: (runId: string, actorId?: string) => Promise<ActorIndexRow | null>
  /** Rows of the runs that effects in `runId` launched. */
  listLaunched: (runId: string) => Promise<ActorIndexRow[]>
  listReviews: (runId?: string) => Promise<ReviewIndexRow[]>
}

function payloadObject(event: EventEnvelope): { [key: string]: JsonValue } {
  if (!Predicate.isObject(event.payload)) {
    return {}
  }

  return event.payload
}

function readString(obj: { [key: string]: JsonValue }, key: string): string | undefined {
  const value = obj[key]
  return Predicate.isString(value) ? value : undefined
}

export function indexOpsFor(event: EventEnvelope): IndexOp[] {
  const payload = payloadObject(event)
  const runId = event.runId
  const actorId = readString(payload, 'threadId') ?? event.threadId ?? runId

  switch (event.type) {
    case 'runtime.run.started': {
      const launchedBy = readRunLaunchSource(payload.launchedBy)

      return [
        {
          type: 'upsertActor',
          runId,
          actorId: runId,
          kind: readString(payload, 'kind') ?? null,
          status: 'running',
          definitionName: readString(payload, 'definitionName') ?? null,
          parentActorId: null,
          launchedByRunId: launchedBy?.runId ?? null,
          launchedByEffectId: launchedBy?.effectId ?? null,
          correlationId: event.correlationId ?? null,
          updatedAt: event.ts,
        },
      ]
    }

    case 'runtime.thread.started':
      return [
        {
          type: 'upsertActor',
          runId,
          actorId,
          kind: readString(payload, 'kind') ?? null,
          status: 'running',
          definitionName: readString(payload, 'definitionName') ?? null,
          parentActorId: readString(payload, 'parentThreadId') ?? null,
          launchedByRunId: null,
          launchedByEffectId: null,
          correlationId: null,
          updatedAt: event.ts,
        },
      ]
    case 'runtime.run.completed':
      return [
        {
          type: 'setActorStatus',
          runId,
          actorId: runId,
          status: completedRunStatus(event.payload),
          updatedAt: event.ts,
        },
      ]
    case 'runtime.thread.completed':
      return [{ type: 'setActorStatus', runId, actorId, status: 'completed', updatedAt: event.ts }]
    case 'runtime.thread.failed':
      return [{ type: 'setActorStatus', runId, actorId, status: 'failed', updatedAt: event.ts }]
    case 'runtime.run.cancelled':
    case 'runtime.thread.cancelled':
      return [{ type: 'setActorStatus', runId, actorId, status: 'cancelled', updatedAt: event.ts }]
    case 'approval.requested':
      return [
        {
          type: 'upsertReview',
          runId,
          reviewId: readString(payload, 'approvalId') ?? 'unknown',
          status: 'pending',
          title: readString(payload, 'title') ?? 'Approval',
          updatedAt: event.ts,
        },
      ]
    case 'approval.decided':
      return [
        {
          type: 'upsertReview',
          runId,
          reviewId: readString(payload, 'approvalId') ?? 'unknown',
          status: payload.outcome === 'reject' ? 'rejected' : 'approved',
          title: 'Approval',
          updatedAt: event.ts,
        },
      ]
    case 'approval.timed_out':
      return [
        {
          type: 'setReviewStatus',
          runId,
          reviewId: readString(payload, 'approvalId') ?? 'unknown',
          status: 'timed_out',
          updatedAt: event.ts,
        },
      ]
    default:
      return []
  }
}

export function createIndexProjector(
  name: string,
  backend: IndexBackend,
  version = '3',
): IndexProjector {
  return {
    name,
    version,
    init: backend.init,
    dispose: backend.dispose,
    project: (events) => {
      const ops = events.flatMap(indexOpsFor)
      return ops.length === 0 ? Promise.resolve() : backend.applyOps(ops)
    },
    getActor: (runId, actorId) => backend.getActor(runId, actorId ?? runId),
    listLaunched: (runId) => backend.listLaunched(runId),
    listReviews: (runId) => backend.listReviews(runId),
  }
}
