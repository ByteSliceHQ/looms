import {
  createIndexProjector,
  type ActorIndexRow,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
  type ReviewIndexRow,
} from './index-model'
import { runProjectorSync, type Projector } from './projector'

function rowKey(runId: string, id: string): string {
  return `${runId}\0${id}`
}

function applyOp(
  actors: Map<string, ActorIndexRow>,
  reviews: Map<string, ReviewIndexRow>,
  op: IndexOp,
): void {
  switch (op.type) {
    case 'upsertActor':
      actors.set(rowKey(op.runId, op.actorId), {
        runId: op.runId,
        actorId: op.actorId,
        kind: op.kind,
        status: op.status,
        definitionName: op.definitionName,
        parentActorId: op.parentActorId,
        updatedAt: op.updatedAt,
      })

      return

    case 'setActorStatus': {
      const key = rowKey(op.runId, op.actorId)
      const existing = actors.get(key)

      actors.set(key, {
        runId: op.runId,
        actorId: op.actorId,
        kind: existing?.kind ?? null,
        status: op.status,
        definitionName: existing?.definitionName ?? null,
        parentActorId: existing?.parentActorId ?? null,
        updatedAt: op.updatedAt,
      })

      return
    }

    case 'upsertReview': {
      const key = rowKey(op.runId, op.reviewId)
      const existing = reviews.get(key)

      reviews.set(key, {
        runId: op.runId,
        reviewId: op.reviewId,
        status: op.status,
        title: existing?.title ?? op.title,
        updatedAt: op.updatedAt,
      })

      return
    }

    case 'setReviewStatus': {
      const key = rowKey(op.runId, op.reviewId)
      const existing = reviews.get(key)

      if (existing) {
        reviews.set(key, { ...existing, status: op.status, updatedAt: op.updatedAt })
      }

      return
    }

    default: {
      const exhaustiveCheck: never = op
      return exhaustiveCheck
    }
  }
}

export function memory(): IndexProjector {
  const actors = new Map<string, ActorIndexRow>()
  const reviews = new Map<string, ReviewIndexRow>()

  const backend: IndexBackend = {
    applyOps: (ops) =>
      runProjectorSync('memory', () => {
        for (const op of ops) {
          applyOp(actors, reviews, op)
        }
      }),
    getActor: (runId, actorId) =>
      runProjectorSync('memory', () => actors.get(rowKey(runId, actorId)) ?? null),
    listReviews: (runId) =>
      runProjectorSync('memory', () => {
        const rows = [...reviews.values()]
        return runId ? rows.filter((row) => row.runId === runId) : rows
      }),
    dispose: () =>
      runProjectorSync('memory', () => {
        actors.clear()
        reviews.clear()
      }),
  }

  return createIndexProjector('memory', backend)
}

/** No-op projector — safe default when indexing is disabled. */
export function noop(): Projector {
  return {
    name: 'noop',
    version: '1',
    project: () => Promise.resolve(),
  }
}
