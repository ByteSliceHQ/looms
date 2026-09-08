import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/concepts')({
  component: Concepts,
})

function Concepts() {
  return (
    <>
      <h1>Concepts</h1>
      <p>
        Looms models application work as a <strong>run</strong>: one durable event
        log that you can crash-recover, replay, and subscribe to from a UI. You
        plug in <strong>modules</strong> for agents, workflows, approvals, or your
        own domain (payments, tickets, search).
      </p>

      <h2>Why this shape</h2>
      <ul>
        <li>
          <strong>Durable by default.</strong> Progress is the log. Restart the
          host and the run continues from the last event.
        </li>
        <li>
          <strong>Composable.</strong> A checkout workflow can wait on an
          approval, then invoke your payments module. An agent can spawn that
          workflow as a tool.
        </li>
        <li>
          <strong>One stream, many views.</strong> The same events power a chat
          transcript, a debugger timeline, a ledger, and pending-approval badges.
        </li>
        <li>
          <strong>Human in the loop.</strong> A run parks until someone decides.
          The UI posts an <code>approval.decided</code> event; the run resumes.
        </li>
      </ul>

      <h2>Run and thread</h2>
      <p>
        A <code>Run</code> is the unit you start, list, and open in a debugger (
        <code>runId</code>). Inside it, <code>Thread</code>s form a tree: a
        root agent or workflow, plus any children it spawned (a specialist agent,
        a checkout workflow, a tool that is itself a run).
      </p>
      <p>
        Status is <code>running</code>, <code>waiting</code> (parked on a timer,
        approval, or child), or terminal (<code>completed</code>,{' '}
        <code>failed</code>, <code>cancelled</code>).
      </p>

      <h2>Events, effects, and waits</h2>
      <p>
        Facts go on the log as typed events. When a thread needs the host to
        do something — call an LLM, charge a card, wait for a human — it requests
        an <strong>effect</strong>. When it needs to pause, it registers a{' '}
        <strong>wait</strong> (on an event type, a payload match, or a timer).
      </p>
      <p>
        The host processes outstanding effects, then parks until a matching event
        arrives. You resume a run by signaling (approval, user message) or by
        waiting for a timer.
      </p>

      <h2>Projections</h2>
      <p>
        A projection is a read model folded from the log:{' '}
        <code>conversation</code>, <code>pendingApprovals</code>, a payments{' '}
        <code>ledger</code>. The same reducer runs on the server and in the
        browser via <code>useProjection</code>, so the UI stays consistent with
        the host.
      </p>

      <h2>Replay</h2>
      <p>
        Because state is derived from events, you can inspect any point in a run.{' '}
        <code>replayTo(runId, seq)</code> gives state before and after that event
        — useful for a debugger and for tests that assert determinism.
      </p>
      <p>
        Next: compose modules in <Link to="/docs/modules">Modules</Link>, or{' '}
        <Link to="/docs/quickstart">start a host</Link>.
      </p>
    </>
  )
}
