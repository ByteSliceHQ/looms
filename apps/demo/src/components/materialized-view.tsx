import { Link } from '@tanstack/react-router'
import { queries, type LoomsStore } from '@looms/livestore/react'
import { ReviewActions } from './review-actions'
import { SyncBadge } from './sync-badge'

export function MaterializedView({
  store,
  actorId,
}: {
  store: LoomsStore
  actorId: string
}) {
  const actors = store.useQuery(queries.actors)
  const messages = store.useQuery(queries.messages)
  const nodes = store.useQuery(queries.nodes)
  const reviews = store.useQuery(queries.reviews)
  const children = store.useQuery(queries.children).filter((c) => c.parentActorId === actorId)
  const events = store.useQuery(queries.events)

  const actor = actors.find((a) => a.actorId === actorId)
  const status = actor?.status ?? null

  return (
    <div className="stack">
      <div className="row">
        <SyncBadge store={store} />
        <span className={`status ${status ?? ''}`}>status: {status ?? '—'}</span>
      </div>

      <div className="grid">
        <section className="panel">
          <h2>Event timeline</h2>
          <div className="timeline">
            {events.length === 0 ? (
              <p className="muted">Waiting for LiveStore sync…</p>
            ) : (
              events.map((e) => (
                <div className="evt" key={e.id}>
                  <div className="seq">#{e.seq}</div>
                  <div>
                    <div className="type">{e.type}</div>
                    <div className="payload">{e.payloadJson}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="stack">
          <section className="panel">
            <h2>Messages</h2>
            <ul>
              {messages.length === 0 ? (
                <li className="muted">—</li>
              ) : (
                messages.map((m) => (
                  <li key={m.id}>
                    <strong>{m.role}</strong>: {m.content}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="panel">
            <h2>Nodes</h2>
            <ul>
              {nodes.length === 0 ? (
                <li className="muted">—</li>
              ) : (
                nodes.map((n) => (
                  <li key={n.id}>
                    <strong>{n.nodeId}</strong> <span className={`status ${n.status}`}>{n.status}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="panel">
            <h2>Reviews</h2>
            <ul>
              {reviews.length === 0 ? (
                <li className="muted">—</li>
              ) : (
                reviews.map((r) => (
                  <li key={r.reviewId}>
                    <div>
                      <strong>{r.title}</strong> <span className={`status ${r.status}`}>{r.status}</span>
                    </div>
                    {r.status === 'pending' ? (
                      <ReviewActions store={store} reviewId={r.reviewId} actorId={actorId} />
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="panel">
            <h2>Children</h2>
            <ul>
              {children.length === 0 ? (
                <li className="muted">—</li>
              ) : (
                children.map((c) => (
                  <li key={c.childActorId}>
                    <Link to="/actors/$actorId" params={{ actorId: c.childActorId }} className="link">
                      {c.childActorId}
                    </Link>{' '}
                    <span className={`status ${c.status}`}>{c.status}</span>
                    {c.definitionName ? ` · ${c.definitionName}` : ''}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="panel">
            <h2>Actors table</h2>
            <ul>
              {actors.length === 0 ? (
                <li className="muted">—</li>
              ) : (
                actors.map((a) => (
                  <li key={a.actorId}>
                    <code>{a.actorId}</code> <span className={`status ${a.status ?? ''}`}>{a.status ?? '—'}</span>
                    {a.definitionName ? ` · ${a.definitionName}` : ''}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
