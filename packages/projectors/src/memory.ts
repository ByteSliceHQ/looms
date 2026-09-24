import {
  createIndexProjector,
  type ActorIndexRow,
  type IndexBackend,
  type IndexOp,
  type IndexProjector,
  type ReviewIndexRow,
} from './index-model'
import { runProjectorSync, type Projector } from './projector'

function applyOp(
  actors: Map<string, ActorIndexRow>,
  reviews: Map<string, ReviewIndexRow>,
  op: IndexOp,
): void {
  switch (op.type) {
    case 'upsertActor':
      actors.set(op.actorId, {
        actorId: op.actorId,
        kind: op.kind,
        status: op.status,
        definitionName: op.definitionName,
        parentActorId: op.parentActorId,
        updatedAt: op.updatedAt,
      })

      return

    case 'setActorStatus': {
      const existing = actors.get(op.actorId)

      actors.set(op.actorId, {
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
      const existing = reviews.get(op.reviewId)

      reviews.set(op.reviewId, {
        reviewId: op.reviewId,
        actorId: op.actorId,
        status: op.status,
        title: existing?.title ?? op.title,
        updatedAt: op.updatedAt,
      })

      return
    }

    case 'setReviewStatus': {
      const existing = reviews.get(op.reviewId)

      if (existing) {
        reviews.set(op.reviewId, { ...existing, status: op.status, updatedAt: op.updatedAt })
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
    getActor: (actorId) => runProjectorSync('memory', () => actors.get(actorId) ?? null),
    listReviews: (actorId) =>
      runProjectorSync('memory', () => {
        const rows = [...reviews.values()]
        return actorId ? rows.filter((row) => row.actorId === actorId) : rows
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
