import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/troubleshooting')({
  head: () => pageHead('/docs/troubleshooting'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Troubleshooting</h1>

      <p>
        Start with the recorded events and the host logs. A UI that has stopped updating does not
        necessarily mean execution stopped.
      </p>
      <h2 id="unknown-definition-or-kind">
        Unknown definition or kind
        <a
          className="heading-anchor"
          href="#unknown-definition-or-kind"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Register the definition on its owning module. Register child definitions as well as roots.
        Install the module implementing the kind. Check exact names and retain old definitions for
        parked runs after deployments.
      </p>
      <h2 id="a-gate-never-resumes">
        A gate never resumes
        <a
          className="heading-anchor"
          href="#a-gate-never-resumes"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Read pendingApprovals, use the pending approvalId, and send a decision through your
        authorized gateway. Check correlation fields and event type. A gate has no automatic
        timeout. An approval.timed_out event alone does not resolve a wait for approval.decided.
      </p>
      <h2 id="reject-still-executes-the-next-node">
        Reject still executes the next node
        <a
          className="heading-anchor"
          href="#reject-still-executes-the-next-node"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        A completed gate means a decision arrived. Check outcome === 'approve' before requesting the
        action. The quickstart publishes only after an explicit approval. Its restart test also
        checks rejection.
      </p>
      <h2 id="the-agent-produces-a-stub-response">
        The agent produces a stub response
        <a
          className="heading-anchor"
          href="#the-agent-produces-a-stub-response"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Supply <code>{'agent({ llm })'}</code> or a runTurn implementation. Omitting the adapter
        intentionally uses deterministic behavior. Check server-side environment variables and the
        provider model ID.
      </p>
      <h2 id="sqlite-fails-under-node">
        SQLite fails under Node
        <a
          className="heading-anchor"
          href="#sqlite-fails-under-node"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        The @looms/core/bun-sqlite entry uses Bun's native SQLite module. Run this example with Bun,
        use the Cloudflare storage adapter in Workers, or implement another compatible store for a
        custom host.
      </p>
      <h2 id="sse-does-not-update">
        SSE does not update
        <a className="heading-anchor" href="#sse-does-not-update" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Confirm the request reaches /api/events with the correct runId and permission context.
        Preserve text/event-stream and streaming bodies through the gateway, disable buffering, and
        check network errors. A disconnected client should resume using its cursor; ensure retention
        has not removed the requested history.
      </p>
      <h2 id="invalid-input-or-events">
        Invalid input or events
        <a
          className="heading-anchor"
          href="#invalid-input-or-events"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Compare the payload with the module's runtime schema. Use typed builders rather than
        handwritten envelopes. Compile-time payload markers do not add runtime validation. Inspect
        HTTP status and body; different hosts may map routing failures differently.
      </p>
      <h2 id="global-run-listing-returns-501">
        Global run listing returns 501
        <a
          className="heading-anchor"
          href="#global-run-listing-returns-501"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        This is the actor host contract. Use your application registry or a cross-run index; see the
        operations guide.
      </p>
      <h2 id="timers-do-not-fire-after-a-local-restart">
        Timers do not fire after a local restart
        <a
          className="heading-anchor"
          href="#timers-do-not-fire-after-a-local-restart"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Reopen the affected run cell to rescan timers. A stopped Bun process cannot fire in-process
        timers, and the local actor host does not enumerate persisted files for you. Use Durable
        Objects for host-managed alarms.
      </p>
      <h2 id="report-a-reproducible-problem">
        Report a reproducible problem
        <a
          className="heading-anchor"
          href="#report-a-reproducible-problem"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Include package versions, host/runtime version, a minimal definition, expected behavior, and
        sanitized event types/sequence. Remove credentials, prompts containing private data, and
        personal identifiers before opening a{' '}
        <a href="https://github.com/ByteSliceHQ/looms/issues">GitHub issue</a>.
      </p>
    </>
  )
}
