import { createFileRoute, Link } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/')({
  head: () => pageHead('/docs'),
  component: Introduction,
})

function Introduction() {
  return (
    <>
      <h1>Build work that can resume</h1>
      <p>
        Looms is a TypeScript library for durable execution in your own application. Compose agents,
        workflows, human decisions, and your own execution types in one run. Their shared event
        history supports recovery, debugging, and live UI views.
      </p>
      <h2 id="start">
        Run the quickstart
        <a className="heading-anchor" href="#start" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        The <Link to="/docs/quickstart">quickstart</Link> installs the package from npm, runs an
        agent and tool inside a workflow, exits while awaiting review, and resumes in a new process.
        You can approve or reject; the workflow handles both.
      </p>
      <h2 id="threads">
        Threads are the extension point
        <a className="heading-anchor" href="#threads" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A run owns a durable event log. Inside it, threads execute work. Agent loops and workflow
        DAGs are built-in thread kinds. A module you write can add a new state machine—such as an
        auction—and compose it with the built-in kinds. You can use existing kinds without writing
        reducers yourself.
      </p>
      <h2 id="choose">
        Choose your path
        <a className="heading-anchor" href="#choose" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>
          <Link to="/docs/when-to-use">Evaluate Looms</Link>: tradeoffs, supported hosts, and where
          it fits your stack.
        </li>
        <li>
          <Link to="/docs/integration">Integrate an existing app</Link>: host, client, gateway, and
          React.
        </li>
        <li>
          <Link to="/docs/concepts/runs-and-threads">Define custom execution</Link>: give a domain
          state machine its own thread kind.
        </li>
        <li>
          <Link to="/docs/hosting-and-storage">Deploy</Link>: Durable Objects, storage, and
          production boundaries.
        </li>
        <li>
          <Link to="/docs/api">API reference</Link>: signatures, lifecycle, HTTP contracts, and
          package modules.
        </li>
      </ul>
      <h2 id="contract">
        Before production
        <a className="heading-anchor" href="#contract" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Historical replay reconstructs state without dispatching effects. Recovery can retry
        unfinished external actions, so handlers need idempotency or reconciliation. Your
        application must authorize requests and keep code compatible with existing runs. Read{' '}
        <Link to="/docs/reliability">reliability</Link> and{' '}
        <Link to="/docs/versioning">versioning</Link> before production.
      </p>
      <p>
        Looms is in the 0.0.x series. Pin the package version and validate your workload. Source,
        release history, and issues are available in the{' '}
        <a href="https://github.com/ByteSliceHQ/looms">repository</a>.
      </p>
    </>
  )
}
