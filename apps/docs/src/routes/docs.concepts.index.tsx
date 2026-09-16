import { createFileRoute, Link } from '@tanstack/react-router'

import { FlowChain } from '../components/flow-chain'
import { ConceptFigure } from '../illustrations/illustration'

export const Route = createFileRoute('/docs/concepts/')({
  component: ConceptsOverview,
})

function ConceptsOverview() {
  return (
    <>
      <h1>Concepts</h1>
      <p>
        Looms is an event-sourced execution runtime. A <strong>run</strong> is the durability
        boundary; threads do the work; events are immutable facts; pure reducers request effects
        that return as new events.
      </p>

      <FlowChain steps={['Event', 'Pure Reducer', 'State + Effects', 'World', 'Event']} />

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Core invariant:</strong> Logical runtime state changes only by processing an event.
      </div>

      <ConceptFigure name="threads" />

      <h2>Where to go next</h2>
      <ul>
        <li>
          <Link to="/docs/concepts/runs-and-threads">Runs &amp; threads</Link> — the tree, statuses,
          custom kinds, and three orthogonal structures.
        </li>
        <li>
          <Link to="/docs/concepts/events-and-effects">Events &amp; effects</Link> — catalogs,
          signals, effect handlers, and the instruction set.
        </li>
        <li>
          <Link to="/docs/concepts/waits-and-replay">Waits &amp; replay</Link> — parking, wake
          cycles, replay, and snapshots.
        </li>
        <li>
          <Link to="/docs/modules">Modules</Link>, <Link to="/docs/projectors">Projections</Link>,{' '}
          <Link to="/docs/hosting-and-storage">Hosting &amp; storage</Link> — how to author,
          project, and host.
        </li>
        <li>
          <Link to="/docs/concepts/type-safety">Type safety</Link> — catalogs through projections
          and React.
        </li>
        <li>
          <Link to="/docs/quickstart">Quickstart</Link> — run something locally, then{' '}
          <Link to="/docs/examples">Examples</Link>.
        </li>
        <li>
          <Link to="/docs/math">Math</Link> — formal specs when you want them.
        </li>
        <li>
          <Link to="/docs/prior-art">Prior art</Link> — event sourcing, reducers, actors, durable
          execution, and React.
        </li>
      </ul>

      <h2>Vocabulary</h2>
      <div className="my-8 mb-14 grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-x-14">
        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/concepts/runs-and-threads">Run</Link>
          </h3>
          <p>
            Durability boundary and event-stream container for one logical operation, identified by{' '}
            <code>runId</code>.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/concepts/runs-and-threads">Thread</Link>
          </h3>
          <p>
            Unit of computation inside a run: agents, workflows, and custom kinds share one
            parent/child tree.
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/concepts/events-and-effects">Event</Link>
          </h3>
          <p>
            Immutable past-tense fact appended to the run log (e.g. <code>approval.decided</code>).
          </p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/concepts/events-and-effects">Effect</Link>
          </h3>
          <p>Intent returned by a pure reducer: invoke IO, spawn a child, emit, or wait.</p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/concepts/events-and-effects">Signal</Link>
          </h3>
          <p>External event injected into the stream — user messages, approvals, webhooks.</p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/concepts/waits-and-replay">Durable wait</Link>
          </h3>
          <p>Parked condition that holds zero worker resources until a matching event or timer.</p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/projectors">Projection</Link>
          </h3>
          <p>Derived read model folded from the stream: chat, ledgers, approval queues, indexes.</p>
        </article>

        <article className="[&_h3]:text-foreground [&_p]:text-muted m-0 p-0 [&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-snug">
          <h3>
            <Link to="/docs/modules">Runtime module</Link>
          </h3>
          <p>
            Package that contributes namespaced events, effects, thread definitions, and
            projections.
          </p>
        </article>
      </div>
    </>
  )
}
