import { createFileRoute, Link } from '@tanstack/react-router'

import approvalExample from '../../../../examples/approval.ts?raw'
import customThread from '../../../../examples/custom-thread.ts?raw'
import workflowExample from '../../../../examples/workflow.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/examples')({
  head: () => pageHead('/docs/examples'),
  component: Examples,
})

function Examples() {
  return (
    <>
      <h1>Runnable examples</h1>
      <p>
        These complete files are imported directly from the examples package, where they are
        typechecked. Copy a file into your project and run it with Bun. Each example here uses
        memory and deterministic behavior, so it needs no provider key. For persistence across
        processes, start with the quickstart.
      </p>
      <CodeBlock lang="bash">{`npm install @looms/runtime @looms/core @looms/agent @looms/workflow @looms/approval zod
# Save one of the files below, then:
bun approval.ts`}</CodeBlock>
      <h2 id="approval">
        Approve or reject
        <a className="heading-anchor" href="#approval" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The workflow checks the gate result before marking the change shipped. Change the decision
        to reject and expect shipped: false. A gate alone does not enforce that branch.
      </p>
      <CodeBlock lang="ts" code={approvalExample} />
      <h2 id="workflow">
        Workflow with a child agent
        <a className="heading-anchor" href="#workflow" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Save as workflow.ts. A node doubles the input, another spawns an agent, and a final node
        combines the results. Both root and child definitions are registered.
      </p>
      <CodeBlock lang="ts" code={workflowExample} />
      <h2 id="custom-thread">
        Your own execution kind
        <a className="heading-anchor" href="#custom-thread" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Save as custom-thread.ts. This auction registers a new kind, accepts bids, waits for a close
        event, and returns a winner. It uses neither the agent nor the workflow module. Expected
        winner: Bob, with a bid of 320 against a reserve of 250.
      </p>
      <CodeBlock lang="ts" code={customThread} />
      <h2 id="next">
        Build a complete app
        <a className="heading-anchor" href="#next" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <Link to="/docs/agents">Connect a model</Link>,{' '}
        <Link to="/docs/integration">mount an authorized gateway and React UI</Link>, or{' '}
        <Link to="/docs/quickstart">persist and recover a review</Link>. Use{' '}
        <Link to="/docs/testing">the restart test</Link> to verify both decisions.
      </p>
    </>
  )
}
