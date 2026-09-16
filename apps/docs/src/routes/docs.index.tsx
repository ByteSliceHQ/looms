import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <>
      <h1>Introduction</h1>
      <p>
        Looms is an event-sourced execution runtime for long-running work inside your application:
        LLM agents, DAG workflows, human approvals, and domain modules you own. You compose the
        capabilities you need, start a <strong>run</strong>, and every worker and client observes
        the same durable event log.
      </p>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Core invariant:</strong> Logical runtime state changes only by processing an event.
        Effects request IO; IO returns as new events. Replay reconstructs state without re-running
        the world.
      </div>

      <p>
        The mental model, vocabulary, and event/effect boundary live in{' '}
        <Link to="/docs/concepts">Concepts</Link>. Formal specs are in{' '}
        <Link to="/docs/math">Math</Link>.
      </p>

      <h2>How to read these docs</h2>
      <ol>
        <li>
          <Link to="/docs/concepts">Concepts</Link> — runs, threads, events, effects, type safety,
          waits.
        </li>
        <li>
          <Link to="/docs/quickstart">Quickstart</Link> and{' '}
          <Link to="/docs/examples">Examples</Link> — run the demo, then copy patterns.
        </li>
        <li>
          <Link to="/docs/modules">Modules</Link> — agents, workflows, approvals, and your own
          packages.
        </li>
        <li>
          <Link to="/docs/projectors">Projections</Link> — reactive UI and cross-run indexes.
        </li>
        <li>
          <Link to="/docs/hosting-and-storage">Hosting &amp; storage</Link> — Cloudflare DOs, celld,
          Bun actors, and hosting before you ship.
        </li>
        <li>
          <Link to="/docs/api">API / SDK</Link> and <Link to="/docs/math">Math</Link> — reference
          when you need them.
        </li>
      </ol>
    </>
  )
}
