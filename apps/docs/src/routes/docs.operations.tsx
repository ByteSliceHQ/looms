import { createFileRoute, Link } from '@tanstack/react-router'

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
        Monitor the execution log, wake scheduling, and downstream indexes separately; each can fail
        independently. Cloudflare manages the actor infrastructure; you still own application
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
        Actor hosts return 501 for global GET /runs and GET /runs/summaries. Maintain an application
        run registry when starting work, or attach a projector that writes a shared index. Store
        runId, tenant ownership, definition version, and creation time. Use that registry to route a
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
      <p>
        <code>GET /runs/:id/status</code> returns thread, deadline, and effect execution status.
        <code>GET /runs/:id/effects</code> narrows that view to durable effect attempts. Retry an
        operator-reviewed effect with <code>POST /runs/:id/effects/:effectId/retry</code>; protect
        mutation-capable operations with an <code>authorize</code> hook such as{' '}
        <code>bearerAuth</code>.
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
        Use <code>looms.cancel</code> or <code>POST /runs/:id/cancel</code> for the whole run or a
        child thread. Cancelling a thread also cancels every live thread below it. A finished run
        rejects later signals with <code>RunTerminalError</code> (HTTP 409); fork it to continue.
        Cancellation can abort cooperative work but cannot retract a payment or message already
        accepted externally. Record operator decisions. If an external action needs to be reversed,
        perform and record that reversal separately.
      </p>
      <h2 id="continue-a-finished-run">
        Continue a finished run
        <a
          className="heading-anchor"
          href="#continue-a-finished-run"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A finished run stays finished: its log is the record of what happened. To pick up a failed
        or cancelled run, fork it with <code>looms.fork(runId)</code> or{' '}
        <code>POST /runs/:id/fork</code>. The fork is a new run that copies the source&apos;s
        history up to the point it finished, keeps its thread ids and sequence numbers, and records
        a <code>runtime.run.forked</code> event naming the source. Its first wake re-issues the
        effects that were outstanding there.
      </p>
      <ul>
        <li>
          A cancelled run resumes from just before the cancellation. An agent re-runs the model call
          or tool the cancel cut off.
        </li>
        <li>
          A failed run resumes from just before the effect whose failure ended it, so that effect
          runs again. Effects declared <code>deterministic</code>, such as workflow scheduling, only
          pass a failure on; the fork retries the work behind them instead.
        </li>
        <li>
          A completed run has nothing outstanding. Forking it completes again with the same output.
        </li>
      </ul>
      <p>
        Re-issued effects run again, so the at-least-once rules for external side effects apply.
        Streamed output from attempts the fork re-runs is replaced by{' '}
        <code>runtime.fork.elided</code> markers. Only the embedded runtime forks runs; actor and
        Durable Object hosts return 501 because each run is its own cell.
      </p>
      <h2 id="observe-behavior">
        Monitor execution
        <a className="heading-anchor" href="#observe-behavior" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Correlate logs by runId, threadId, effectId, and sequence. Track failed effects, oldest
        pending approvals, retry deadlines, ambiguous external outcomes, wake latency, provider
        errors, stream reconnects, and projector lag. Export metrics through your host's
        observability stack. Do not log secrets or use estimated token usage as an invoice.
      </p>
      <p>
        After restoring storage or changing alarm infrastructure, call{' '}
        <code>POST /operations/deadlines/rescan</code> to rebuild timer, effect retry, and timeout
        scheduling from the log.
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
      <h2 id="debugger">
        Debugger
        <a className="heading-anchor" href="#debugger" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>createLooms</code> can serve a debugger that shows each run&apos;s thread tree, event
        log, replay, and projections. The <Link to="/docs/debugger">debugger guide</Link> covers
        setup, access control, views for your own modules, and Durable Object hosts.
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
