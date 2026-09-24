import { createFileRoute, Link } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/reliability')({
  head: () => pageHead('/docs/reliability'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Reliability and recovery</h1>

      <p>
        Durability depends on the host and storage you choose. In-memory examples lose history on
        exit. SQLite persists locally; production actor hosts must preserve one writer per run and
        provide wake scheduling.
      </p>
      <h2 id="replay-and-recovery-are-different-operations">
        Replay and recovery are different operations
        <a
          className="heading-anchor"
          href="#replay-and-recovery-are-different-operations"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Historical replay folds recorded events to reconstruct state and does not dispatch effects.
        Recovery loads a snapshot and later events, then resumes unfinished work. An effect that
        lacks a recorded outcome may execute again. Looms does not promise exactly-once actions
        across arbitrary external services.
      </p>
      <h2 id="the-ambiguous-outcome-window">
        A crash after an external action
        <a
          className="heading-anchor"
          href="#the-ambiguous-outcome-window"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <ol>
        <li>Looms requests an external action.</li>
        <li>The service performs it.</li>
        <li>The host stops before recording success.</li>
        <li>Recovery cannot infer success from the local log alone.</li>
      </ol>
      <p>
        Pass ctx.effectId as an idempotency key where the external API supports it. Check that the
        service retains the key for as long as you may need to retry the action. For unsupported
        APIs, store a durable operation ID, query the provider for the outcome, or reconcile before
        retrying. Never assume adding an arbitrary header makes an API idempotent.
      </p>
      <h2 id="retries-and-errors">
        Retries and errors
        <a className="heading-anchor" href="#retries-and-errors" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Effect retry policies count total attempts: maxAttempts: 3 means one initial attempt and up
        to two retries. Attempt starts and retry deadlines are recorded before the runtime waits, so
        a restart preserves the retry budget and backoff. Configure start, heartbeat, and execution
        timeouts for work delivered to external workers. Worker callbacks include the effect ID and
        attempt number; stale callbacks cannot complete a newer attempt. Exhaustion records{' '}
        <code>runtime.effect.failed</code>.
      </p>
      <h2 id="signals-and-webhook-delivery">
        Signals and webhook delivery
        <a
          className="heading-anchor"
          href="#signals-and-webhook-delivery"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Use the embed start/signal idempotencyKey option with a stable runId for retries of the same
        logical request. Verify webhook signatures and transform allowed webhook payloads into typed
        events on the server. Deduplicate by the provider delivery ID and correlate by run, thread,
        and domain identifiers. Retrying with a fresh key defeats deduplication.
      </p>
      <h2 id="interrupted-model-streams">
        Interrupted model streams
        <a
          className="heading-anchor"
          href="#interrupted-model-streams"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A model call can produce partial deltas before failing. Those deltas may already be
        recorded; resuming work may incur another model call and different output. Render partial
        content as provisional, inspect completion events, and decide how your application handles
        abandoned partial turns. The adapter does not guarantee exactly-once billing or identical
        regenerated text.
      </p>
      <h2 id="snapshots-retention-and-projections">
        Snapshots, retention, and projections
        <a
          className="heading-anchor"
          href="#snapshots-retention-and-projections"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A compatible snapshot bounds replay work; it is not a backup or a schema migration. Trimming
        events removes older audit and time-travel history and can prevent rebuilding new
        projections from the beginning. Define a retention and archive policy before enabling
        trimAfterSnapshot.
      </p>
      <p>
        Projectors run after local commit. Durable delivery stores a cursor per projector name and
        version, retries without advancing that cursor, and dead-letters exhausted batches. A run
        can finish before an external index or webhook catches up, so monitor lag and keep projector
        writes idempotent.
      </p>
      <h2 id="verify-your-boundary">
        Test recovery
        <a
          className="heading-anchor"
          href="#verify-your-boundary"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Test a restart while parked, an interruption during an external action, duplicate webhook
        delivery, and a deployment with existing runs. The{' '}
        <Link to="/docs/testing">testing guide</Link> provides the local restart test. Review{' '}
        <Link to="/docs/versioning">versioning</Link> before changing definitions.
      </p>
    </>
  )
}
