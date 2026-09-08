import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { queries, type LoomsStore } from '@looms/livestore/react'

function eventFamily(type: string): string {
  if (type.startsWith('agent.')) return 'agent'
  if (type.startsWith('tool.') || type.startsWith('child.')) return 'tool'
  if (type.startsWith('workflow.') || type.startsWith('review.')) return 'workflow'
  if (type.startsWith('actor.')) return 'actor'
  return 'other'
}

export function EventFeed({ store, actorId }: { store: LoomsStore; actorId: string }) {
  const events = store.useQuery(queries.events)
  const children = store.useQuery(queries.children).filter((child) => child.parentActorId === actorId)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [events.length])

  const newestId = events.at(-1)?.id

  return (
    <div className="stack">
      <section className="panel">
        <h2>Event timeline</h2>
        <div className="timeline event-feed">
          {events.length === 0 ? (
            <p className="muted">Waiting for LiveStore sync…</p>
          ) : (
            events.map((evt) => (
              <div className={`evt family-${eventFamily(evt.type)}${evt.id === newestId ? ' newest' : ''}`} key={evt.id}>
                <div className="seq">#{evt.seq}</div>
                <div>
                  <div className="type">{evt.type}</div>
                  <div className="payload">{evt.payloadJson}</div>
                </div>
              </div>
            ))
          )}
          <div ref={bottom} />
        </div>
      </section>
      <section className="panel">
        <h2>Children</h2>
        <ul>
          {children.length === 0 ? (
            <li className="muted">—</li>
          ) : (
            children.map((child) => (
              <li key={child.childActorId}>
                <Link to="/actors/$actorId" params={{ actorId: child.childActorId }} className="link">
                  {child.childActorId}
                </Link>{' '}
                <span className={`status ${child.status}`}>{child.status}</span>
                {child.definitionName ? ` · ${child.definitionName}` : ''}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
