import { decideReview, type LoomsStore } from '@looms/livestore/react'

export function ReviewActions({
  store,
  reviewId,
}: {
  store: LoomsStore
  reviewId: string
  actorId?: string
}) {
  function decide(outcome: 'approve' | 'reject') {
    decideReview(store, {
      reviewId,
      actionId: outcome,
      outcome,
    })
  }

  return (
    <div className="row tight">
      <button type="button" className="ok" onClick={() => decide('approve')}>
        Approve
      </button>
      <button type="button" className="bad" onClick={() => decide('reject')}>
        Reject
      </button>
    </div>
  )
}
