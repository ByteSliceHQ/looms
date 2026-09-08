import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/concepts')({
  component: Concepts,
})

function Concepts() {
  return (
    <>
      <h1>Concepts</h1>
      <p>
        An actor is identified by <code>actorId</code>. Kind is either{' '}
        <code>agent</code> (message turns, tools, optional child actors) or{' '}
        <code>workflow</code> (a DAG of nodes with deps, reviews, timers, and nested
        spawns).
      </p>
      <p>
        Durable facts are <code>LoomsEvent</code> records in an{' '}
        <code>EventStore</code> log (memory or an S2 stream per actor).{' '}
        <code>reduceActor(events)</code> derives <code>ActorState</code> plus owed
        work — what the host must do next.
      </p>
      <h2>Wake loop</h2>
      <p>
        <code>LoomsRuntime.wake(actorId)</code> reads the log, reduces, executes
        actionable owed work, appends the produced events, and repeats until the
        actor is terminal or parked.
      </p>
      <ul>
        <li>
          <code>waiting_review</code> — until <code>review.decided</code> or timeout
        </li>
        <li>
          <code>waiting_child</code> — until <code>child.completed</code>
        </li>
        <li>
          <code>waiting_timer</code> — until <code>timer.fired</code>
        </li>
      </ul>
      <h2>Projectors</h2>
      <p>
        The log is a poor query surface. A projector writes a secondary index —
        actors by status, pending reviews, a search store, a webhook — after each
        successful append. It is never the source of truth. See{' '}
        <Link to="/docs/projectors">Projectors</Link> for the interface and the
        memory / SQLite / Postgres helpers.
      </p>
      <h2>Client sync</h2>
      <p>
        Clients materialize the same events with <code>@looms/livestore</code> /{' '}
        <code>@looms/livestore/react</code>. The host proxies{' '}
        <code>/api/livestore</code> — no custom WebSocket protocol.
      </p>
    </>
  )
}
