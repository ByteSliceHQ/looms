import { createFileRoute, Link } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/when-to-use')({
  head: () => pageHead('/docs/when-to-use'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>When to use Looms</h1>

      <p>
        Looms is a TypeScript execution runtime that you deploy in your own infrastructure. Use it
        when several kinds of work need to share durable state: an agent delegates to a workflow, a
        custom state machine waits for a webhook, and a human decides what happens next.
      </p>
      <h2 id="one-run-many-kinds-of-work">
        One run, many kinds of work
        <a
          className="heading-anchor"
          href="#one-run-many-kinds-of-work"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A thread is a unit of execution with a kind and a state machine. Agents and DAG workflows
        are built-in kinds. Your own module can define a new kind using the same extension
        primitives. Threads nest within a run and share its ordered history, recovery, and
        projections.
      </p>
      <p>
        For example: a procurement agent starts a review workflow, which spawns a custom auction
        thread. The auction accepts bids until a deadline, records a winner, and returns a result to
        the workflow. The debugger can show the whole operation without joining logs from unrelated
        runtimes.
      </p>
      <h2 id="good-fits">
        Good fits
        <a className="heading-anchor" href="#good-fits" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>Work that pauses for minutes or days on approvals, webhooks, or child results.</li>
        <li>Applications that combine model-driven decisions with deterministic business rules.</li>
        <li>Domain execution types that need more than a fixed agent loop or DAG.</li>
        <li>
          Products whose UI, audit history, and runtime state should come from the same events.
        </li>
      </ul>
      <h2 id="costs-you-take-on">
        Costs you take on
        <a className="heading-anchor" href="#costs-you-take-on" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        You choose the host, enforce authorization, operate storage, and design compatible upgrades.
        Reducers must remain deterministic. External actions need idempotency or reconciliation. A
        single run has one writer; partition independent work into separate runs rather than
        treating a run as an unlimited parallel compute cluster.
      </p>
      <h2 id="when-a-simpler-approach-is-enough">
        When a simpler approach is enough
        <a
          className="heading-anchor"
          href="#when-a-simpler-approach-is-enough"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A single model request, a stateless tool call, or a short request-response API may not need
        Looms. If your existing durable workflow engine already handles your execution model,
        adopting another one adds migration and operational work. Start with a specific need for
        custom thread composition or a shared execution history.
      </p>
      <h2 id="how-it-fits-existing-tools">
        How it fits existing tools
        <a
          className="heading-anchor"
          href="#how-it-fits-existing-tools"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <ul>
        <li>
          <strong>Vercel AI SDK:</strong> keep its model providers. The Looms adapter calls the
          model while Looms schedules turns and tools. You do not run a second automatic tool loop
          alongside it.
        </li>
        <li>
          <strong>Durable Objects:</strong> supply the actor isolation, SQLite, and alarm host.
          Looms supplies thread composition, event history, effects, and projections.
        </li>
        <li>
          <strong>Temporal, Restate, DBOS, and other durable engines:</strong> evaluate execution
          guarantees and operations against your needs. Looms centers its programming model on
          extensible thread kinds sharing one run log; this is a design distinction, not a claim of
          feature parity.
        </li>
        <li>
          <strong>Your existing agent loop:</strong> adapt one turn through <code>runTurn</code> or
          a model adapter. Arbitrary code does not become durable just by being called; outcomes and
          externally visible work must cross recorded boundaries.
        </li>
      </ul>
      <h2 id="release-status-and-support">
        Release status and support
        <a
          className="heading-anchor"
          href="#release-status-and-support"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Looms is an early 0.1-series library. Expect API evolution, pin package versions, and test
        recovery before production use. Cloudflare Durable Objects is the recommended production
        host; Bun with SQLite is the local path. Browser packages provide clients and projections.
        Custom hosts require you to preserve one writer per run.
      </p>
      <p>
        <Link to="/docs/quickstart">Try a complete run</Link>, then read{' '}
        <Link to="/docs/integration">integration</Link> and{' '}
        <Link to="/docs/reliability">reliability</Link>. Source and issues:{' '}
        <a href="https://github.com/ByteSliceHQ/looms">ByteSliceHQ/looms</a>.
      </p>
    </>
  )
}
