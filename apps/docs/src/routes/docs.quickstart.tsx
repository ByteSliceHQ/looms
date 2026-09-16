import { createFileRoute, Link } from '@tanstack/react-router'

import runner from '../../../../examples/durable-review.ts?raw'
import definitions from '../../../../examples/review-definition.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/quickstart')({
  head: () => pageHead('/docs/quickstart'),
  component: Quickstart,
})

function Quickstart() {
  return (
    <>
      <h1>Run, stop, resume</h1>
      <p>
        Build an agent that drafts a release announcement, then let a workflow wait for a human
        decision. Exit the process, start a new one, and approve or reject the same run. Its history
        and pending review survive.
      </p>
      <p>
        This tutorial uses <strong>Bun 1.3 or later</strong> and local SQLite. It makes no network
        calls: the agent uses a deterministic turn function and publishing is simulated. The same
        definitions can use a real model and a production actor host.
      </p>
      <h2 id="create-a-project">
        Create a project
        <a className="heading-anchor" href="#create-a-project" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="bash">{`mkdir looms-starter
cd looms-starter
npm init -y
npm install @swirls/looms zod`}</CodeBlock>
      <p>
        The package installs from npm; Bun executes the TypeScript and provides SQLite. Pin{' '}
        <code>@swirls/looms</code> deliberately and commit your lockfile. Node alone cannot execute
        the Bun SQLite example.
      </p>
      <h2 id="define-the-work">
        Define the work
        <a className="heading-anchor" href="#define-the-work" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Save this as <code>review-definition.ts</code>. The workflow spawns a writer agent with a
        tool, asks for a decision, and checks the outcome before publishing. A rejection completes
        the workflow with <code>published: false</code>.
      </p>
      <CodeBlock lang="ts" code={definitions} />
      <h2 id="add-durable-storage">
        Add durable storage
        <a className="heading-anchor" href="#add-durable-storage" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Save this as <code>durable-review.ts</code>. SQLite holds the event log and snapshots; each
        invocation opens the same file. Run one command at a time—this is a single-process embed,
        not a multi-writer server.
      </p>
      <CodeBlock lang="ts" code={runner} />
      <h2 id="start-and-stop">
        Start and stop
        <a className="heading-anchor" href="#start-and-stop" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="bash">{'bun durable-review.ts start'}</CodeBlock>
      <p>
        The command prints a <code>runId</code> and exits. Copy that ID into the next commands. The
        pending approval is durable even when an aggregate run status still reads{' '}
        <code>running</code>; inspect the approval projection to see what needs attention.
      </p>
      <CodeBlock lang="bash">{'bun durable-review.ts inspect YOUR_RUN_ID'}</CodeBlock>
      <p>
        This is a new process. It should show one pending review and the agent/tool events recorded
        by the first process.
      </p>
      <h2 id="resume-with-a-decision">
        Resume with a decision
        <a
          className="heading-anchor"
          href="#resume-with-a-decision"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <CodeBlock lang="bash">{'bun durable-review.ts approve YOUR_RUN_ID'}</CodeBlock>
      <p>
        Expect <code>status: "completed"</code> and <code>published: true</code> in the output.
        Inspect it again: the result is still there, with no need to rerun the writer.
      </p>
      <p>Start another run and reject it instead:</p>
      <CodeBlock lang="bash">{'bun durable-review.ts reject ANOTHER_RUN_ID'}</CodeBlock>
      <p>
        Expect <code>published: false</code>. A gate waits for a decision; it does not automatically
        treat rejection as an execution error. Always check the result before a consequential
        action.
      </p>
      <h2 id="make-it-yours">
        Make it yours
        <a className="heading-anchor" href="#make-it-yours" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>
          <Link to="/docs/agents">Connect a real model</Link> and keep the review deterministic.
        </li>
        <li>
          <Link to="/docs/concepts/runs-and-threads">Define a custom thread kind</Link> with its own
          state machine.
        </li>
        <li>
          <Link to="/docs/projectors">Build a live React view</Link> of the same history.
        </li>
        <li>
          <Link to="/docs/hosting-and-storage">Deploy to Cloudflare Durable Objects</Link> with one
          actor per run.
        </li>
      </ul>
      <p>
        These source files are shared with the runnable examples and tested across separate
        processes. The full{' '}
        <a href="https://github.com/ByteSliceHQ/looms/tree/main/examples">examples directory</a>{' '}
        includes smaller patterns.
      </p>
    </>
  )
}
