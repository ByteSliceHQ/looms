import { queries, useActorStore, type LoomsStore } from '@looms/livestore/react'
import { Suspense } from 'react'
import { ReviewActions } from './review-actions'

function ChildReviewList({ store }: { store: LoomsStore }) {
  const reviews = store.useQuery(queries.reviews)
  const pending = reviews.filter((review) => review.status === 'pending')
  if (pending.length === 0) return null
  return (
    <ul>
      {pending.map((review) => (
        <li key={review.reviewId}>
          <div>
            <strong>{review.title}</strong>{' '}
            <span className={`status ${review.status}`}>{review.status}</span>
          </div>
          {review.description ? <p className="muted">{review.description}</p> : null}
          <ReviewActions store={store} reviewId={review.reviewId} />
        </li>
      ))}
    </ul>
  )
}

function ChildReviewStore({ childActorId }: { childActorId: string }) {
  const store = useActorStore(childActorId)
  return <ChildReviewList store={store} />
}

export function ChildReviews({ store, actorId }: { store: LoomsStore; actorId: string }) {
  const children = store.useQuery(queries.children).filter((child) => child.parentActorId === actorId)
  if (children.length === 0) return null

  return (
    <section className="panel">
      <h2>Child reviews</h2>
      {children.map((child) => (
        <div key={child.childActorId} className="stack">
          <div className="muted">{child.definitionName ?? child.childActorId}</div>
          <Suspense fallback={<p className="muted">Loading child…</p>}>
            <ChildReviewStore childActorId={child.childActorId} />
          </Suspense>
        </div>
      ))}
    </section>
  )
}
