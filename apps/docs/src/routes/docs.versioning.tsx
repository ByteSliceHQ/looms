import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/versioning')({
  head: () => pageHead('/docs/versioning'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Changing deployed code</h1>

      <p>
        A run may outlive the code that started it. Recovery uses the definitions and reducers
        installed on the host when it resumes. Looms does not automatically pin a historical code
        bundle for each run.
      </p>
      <h2 id="keep-old-definitions-available">
        Keep old definitions available
        <a
          className="heading-anchor"
          href="#keep-old-definitions-available"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Use stable versioned names, such as release-v1 and release-v2, for behavior that cannot
        safely change in place. Register both while old runs remain active, and start new runs with
        v2. Keep child definition names and module event contracts compatible as well; changing the
        root name alone does not version shared reducers.
      </p>
      <h2 id="evolve-events-additively">
        Evolve events additively
        <a
          className="heading-anchor"
          href="#evolve-events-additively"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Existing logs contain old payloads. Prefer optional fields with defined defaults or new
        event names for incompatible meanings. Keep old logs and snapshots as compatibility test
        fixtures. A module's protocolVersion is descriptive metadata, not an automatic migration
        engine.
      </p>
      <h2 id="plan-snapshot-changes">
        Plan snapshot changes
        <a
          className="heading-anchor"
          href="#plan-snapshot-changes"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Reducers and snapshot state must agree. Test loading existing snapshots before deployment.
        When a change is incompatible, keep the old implementation routed to old runs, migrate those
        runs with your own tools, or let them finish before retiring the old code. Do not rewrite
        historical events casually to make a new reducer accept them.
      </p>
      <h2 id="a-deployment-procedure">
        A deployment procedure
        <a
          className="heading-anchor"
          href="#a-deployment-procedure"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <ol>
        <li>Inventory active and parked runs through your run index.</li>
        <li>Run old-history and snapshot compatibility tests.</li>
        <li>Deploy code that can still execute old definitions.</li>
        <li>
          Start a canary using the new definition and exercise reject, timeout, and restart paths.
        </li>
        <li>Monitor failures and keep the prior deployment available.</li>
        <li>
          Retire old definitions after their runs finish and you no longer need them for retained
          history.
        </li>
      </ol>
      <h2 id="rollback-limits">
        Rollback limits
        <a className="heading-anchor" href="#rollback-limits" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        A rollback cannot undo external actions. Old code may not understand events written by a new
        deployment. Plan forward-compatible readers or a controlled recovery procedure before
        rollout. Restoring a database backup also requires reconciling actions performed since the
        backup.
      </p>
    </>
  )
}
