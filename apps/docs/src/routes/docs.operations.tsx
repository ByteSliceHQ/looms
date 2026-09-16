import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/operations')({
  head: () => pageHead('/docs/operations'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Operate Looms</h1>

      <p>
        Operate the execution log, wake mechanism, and downstream read models separately. Each can
        fail independently. Cloudflare manages the actor infrastructure; you still own application
        behavior and observability.
      </p>
      <h2 id="find-runs-and-pending-work">
        Find runs and pending work
        <a
          className="heading-anchor"
          href="#find-runs-and-pending-work"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Actor hosts intentionally return 501 for global GET /runs. Maintain an application run
        registry when starting work, or attach a projector that writes a shared index. Store runId,
        tenant ownership, definition version, and creation time. Use that registry to route a
        dashboard to each run's current state and authorized event stream.
      </p>
      <p>
        The projectors page shows memory, SQLite, and Postgres index helpers. Actor-local SQLite is
        not a global index across Durable Objects. A cross-run database or external registry must be
        reachable by each relevant host. Monitor indexing errors and support rebuilding from
        retained history.
      </p>
      <h2 id="inspect-a-stuck-run">
        Inspect a stuck run
        <a className="heading-anchor" href="#inspect-a-stuck-run" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ol>
        <li>Read /runs/:id and its recorded events.</li>
        <li>Find the last effect failure, unsatisfied wait, or missing child outcome.</li>
        <li>Check event type and correlation identifiers against the wait.</li>
        <li>Check the provider outcome before repeating an external action.</li>
        <li>
          Use wake only after resolving the underlying cause; it is not an unconditional retry-all
          API.
        </li>
      </ol>
      <p>
        A run may report running while it has a pending human review. Inspect thread state and
        pendingApprovals instead of treating one aggregate status as a complete work queue.
      </p>
      <h2 id="cancellation-and-intervention">
        Cancellation and intervention
        <a
          className="heading-anchor"
          href="#cancellation-and-intervention"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Use the embed cancellation API for the whole run or a child thread. Cancellation can abort
        cooperative work but cannot retract a payment or message already accepted externally. Record
        operator decisions and use explicit compensating application actions where needed.
      </p>
      <h2 id="observe-behavior">
        Observe behavior
        <a className="heading-anchor" href="#observe-behavior" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Correlate logs by runId, threadId, effectId, and sequence. Track failed effects, oldest
        pending approvals, wake latency, provider errors, stream reconnects, and projector lag.
        Export metrics through your host's observability stack. Do not log secrets or use estimated
        token usage as an invoice.
      </p>
      <h2 id="backups-and-retention">
        Backups and retention
        <a
          className="heading-anchor"
          href="#backups-and-retention"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Choose a backup strategy for the host's SQLite and snapshot data and practice restoration.
        Set retention based on recovery, audit, and privacy requirements. Replication to a lake is
        not automatically a verified backup; confirm completeness and a restore procedure. Trimming
        old events changes the history available to replay and new projections.
      </p>
      <h2 id="local-hosts-and-timers">
        Local hosts and timers
        <a
          className="heading-anchor"
          href="#local-hosts-and-timers"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        createLocalActorHost opens run cells lazily. Keep a list of known runs and call getCell for
        those needing timer recovery after restart, or use a host with durable alarms. The in-memory
        timeout scheduler does not wake a stopped process.
      </p>
    </>
  )
}
