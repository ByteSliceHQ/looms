import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/prior-art')({
  component: PriorArt,
})

function PriorArt() {
  return (
    <>
      <h1>Prior art</h1>
      <p>
        Looms combines established patterns from event-sourced systems, reducer architectures,
        actors, and durable execution. These systems shaped the model and provide useful points of
        comparison.
      </p>

      <h2>Event sourcing and projections</h2>
      <p>
        <a
          href="https://martinfowler.com/eaaDev/EventSourcing.html"
          target="_blank"
          rel="noreferrer"
        >
          Event Sourcing
        </a>{' '}
        records state changes as an append-only sequence of events. Replaying that sequence
        reconstructs state; folding it into other shapes produces projections. Looms uses one
        canonical event stream per run for thread state, debugging, and UI projections.
      </p>

      <h2>Flux and Redux</h2>
      <p>
        <a
          href="https://facebookarchive.github.io/flux/docs/in-depth-overview/"
          target="_blank"
          rel="noreferrer"
        >
          Flux
        </a>{' '}
        popularized unidirectional data flow in JavaScript applications.{' '}
        <a
          href="https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers"
          target="_blank"
          rel="noreferrer"
        >
          Redux
        </a>{' '}
        made the reducer form familiar: current state plus an action produces next state. Looms
        applies a related reducer model to durable event streams. Its events are persisted facts,
        and thread reducers can return effect instructions for the runtime to execute.
      </p>

      <h2>Actors</h2>
      <p>
        Actor systems isolate mutable state and process messages serially. Looms uses that shape at
        the hosting boundary: one actor cell owns each <code>runId</code> and writes its log.
        Cloudflare{' '}
        <a
          href="https://developers.cloudflare.com/durable-objects/what-are-durable-objects/"
          target="_blank"
          rel="noreferrer"
        >
          Durable Objects
        </a>{' '}
        are the primary production host, but the same single-writer contract works with local Bun
        actors and custom hosts.
      </p>

      <h2>Durable execution</h2>
      <p>
        Systems such as{' '}
        <a href="https://temporal.io/" target="_blank" rel="noreferrer">
          Temporal
        </a>
        ,{' '}
        <a href="https://restate.dev/" target="_blank" rel="noreferrer">
          Restate
        </a>
        , and{' '}
        <a href="https://www.dbos.dev/" target="_blank" rel="noreferrer">
          DBOS
        </a>{' '}
        let application work survive process failure and long waits. Looms shares those goals. Its
        programming model centers on event streams, pure reducers, explicit effect instructions, and
        modules that contribute thread kinds and projections.
      </p>

      <h2>React</h2>
      <p>
        React made declarative UI and state-derived views common in frontend code. Looms borrows
        that broad approach: application code describes transitions and projections while the
        runtime schedules work and recovery. The analogy stops there. A Looms thread is not a React
        component, and a Looms effect is not <code>useEffect</code>. <code>@looms/react</code> is an
        adapter for subscribing to run streams and projections.
      </p>

      <p>
        See <Link to="/docs/concepts">Concepts</Link> for Looms terminology,{' '}
        <Link to="/docs/concepts/events-and-effects">Events &amp; effects</Link> for reducer
        semantics, and <Link to="/docs/concepts/waits-and-replay">Waits &amp; replay</Link> for
        recovery behavior.
      </p>
    </>
  )
}
