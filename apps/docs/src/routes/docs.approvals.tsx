import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/approvals')({
  head: () => pageHead('/docs/approvals'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Human approvals</h1>

      <p>
        <code>gate()</code> records an approval request and waits for a matching decision. It is a
        waiting primitive. Your application decides what approval, rejection, and expiration mean.
      </p>
      <h2 id="require-an-explicit-approval">
        Require an explicit approval
        <a
          className="heading-anchor"
          href="#require-an-explicit-approval"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        The complete <Link to="/docs/quickstart">quickstart</Link> checks the review result with a
        schema requiring <code>outcome: 'approve'</code>. Every other result takes the unpublished
        branch. A rejected gate can complete normally, so a node dependency alone never authorizes
        an action.
      </p>
      <CodeBlock lang="ts">{`// Fragment inside the node after a gate:
const approved = z.object({ outcome: z.literal('approve') })
if (!approved.safeParse(ctx.results.review).success) {
  return { published: false }
}
// Only this branch may request the publication effect.`}</CodeBlock>
      <h2 id="deliver-a-decision">
        Deliver a decision
        <a className="heading-anchor" href="#deliver-a-decision" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="ts">{`import { decision, pendingApprovals } from '@looms/approval'

const reviews = await looms.project(runId, pendingApprovals)
const pending = reviews.items.find((review) => review.status === 'pending')
if (!pending) throw new Error('No pending approval')
await looms.signal(runId, [decision(pending.approvalId, 'reject')], {
  idempotencyKey: 'decision-request-from-your-application',
})`}</CodeBlock>
      <p>
        Authenticate the reviewer, authorize access to this run and approval, and validate the
        action on the server. Use a unique key per logical request and reuse it for retries of that
        request. A new key represents a new request; it is not conflict resolution.
      </p>
      <h2 id="concurrent-and-duplicate-decisions">
        Concurrent and duplicate decisions
        <a
          className="heading-anchor"
          href="#concurrent-and-duplicate-decisions"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Correlate waits by approvalId, not only the event type. Concurrent approvals can otherwise
        satisfy the wrong wait. Serialize decisions at an authoritative application boundary and
        reject decisions for already resolved approvals. A read of pendingApprovals followed by a
        write is not an atomic compare-and-set across multiple clients.
      </p>
      <p>
        The runtime validates event shape, but does not implement your reviewer identity, permission
        policy, or a complete approval lifecycle service. Do not allow clients to submit arbitrary
        approval.decided events.
      </p>
      <h2 id="expiration-and-late-replies">
        Expiration and late replies
        <a
          className="heading-anchor"
          href="#expiration-and-late-replies"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        <code>gate()</code> has no automatic timeout option. To expire approvals, define an
        application workflow or custom thread that records a deadline, waits for a correlated
        decision or timer, and fails closed on timeout. Record expiration explicitly and reject late
        decisions at the gateway. Merely emitting approval.timed_out does not satisfy a gate waiting
        for approval.decided.
      </p>
      <h2 id="review-ui">
        Review UI
        <a className="heading-anchor" href="#review-ui" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Render only pending items from pendingApprovals. Show the proposed action and relevant
        inputs, offer approve and reject, disable controls while a request is in flight, and display
        failures. The server must still enforce the decision policy. Reconnect by reading the
        recorded state rather than assuming a click succeeded.
      </p>
    </>
  )
}
