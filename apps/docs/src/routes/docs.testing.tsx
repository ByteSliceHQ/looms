import { createFileRoute } from '@tanstack/react-router'

import recoveryTest from '../../../../examples/durable-review.test.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/testing')({
  head: () => pageHead('/docs/testing'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Test execution and recovery</h1>

      <p>
        Test the application's observable behavior: whether a rejected action occurs, whether a
        pending wait survives restart, and whether replay changes anything outside the runtime.
      </p>
      <h2 id="use-deterministic-agents">
        Use deterministic agents
        <a
          className="heading-anchor"
          href="#use-deterministic-agents"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        The quickstart's writer uses runTurn and a typed tool without a model API. This makes
        approval and recovery tests reproducible. Keep model quality evaluations separate from
        runtime correctness tests.
      </p>
      <h2 id="exercise-both-decision-branches">
        Exercise both decision branches
        <a
          className="heading-anchor"
          href="#exercise-both-decision-branches"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Start the release workflow, find its pending approval, and send approve or reject. Assert on
        the publication result, not just workflow completion. Rejection is a valid completed
        business outcome. Use the complete executable test below in the same directory as the two
        quickstart files.
      </p>
      <CodeBlock lang="ts" code={recoveryTest} />
      <CodeBlock lang="bash">{'bun test durable-review.test.ts'}</CodeBlock>
      <p>
        Each command runs in a different process against the same temporary SQLite file. The test
        verifies a pending review survives exit, either decision resumes it, and the final result
        survives another restart.
      </p>
      <h2 id="module-and-replay-helpers">
        Module and replay helpers
        <a
          className="heading-anchor"
          href="#module-and-replay-helpers"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Install @looms/testing for createTestRuntime, assertReplayDeterministic, and
        moduleConformance. createTestRuntime supplies an in-memory store and a run helper for
        Effect-based runtime operations. assertReplayDeterministic compares repeated folds of a log;
        it does not prove external idempotency or compatibility with future code.
      </p>
      <h2 id="before-deploying">
        Before deploying
        <a className="heading-anchor" href="#before-deploying" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>Fault-inject an interrupted effect with a provider-supported idempotency key.</li>
        <li>Send duplicate and conflicting webhook/approval requests through your gateway.</li>
        <li>Load a snapshot and history produced by the previous application version.</li>
        <li>Test authorization for another tenant's run and event stream.</li>
        <li>Disconnect and reconnect the UI while execution continues.</li>
        <li>Verify your backup restoration and downstream index backfill.</li>
      </ul>
    </>
  )
}
