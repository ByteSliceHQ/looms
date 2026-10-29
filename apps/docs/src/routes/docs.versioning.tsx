import { createFileRoute } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
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
        A run records the exact version of every definition it starts. Recovery resolves that
        version, so the host must keep that implementation loadable while the run can wake:
        register it on a module, or return it from <code>definitionResolver</code>. Looms does not
        store the historical code bundle for you.
      </p>
      <p>
        This durability contract is separate from the SemVer version of <code>@swirls/looms</code>.
        A compatible package upgrade can still require a durable-definition or event migration for
        your application.
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
        Set the definition's <code>version</code>, and register old and new versions together.
        Starts and child spawns persist <code>kind:name@version</code>; they never resolve to a
        floating latest version. Keep shared reducers and event contracts compatible with both
        versions.
      </p>
      <h2 id="load-definitions-dynamically">
        Load definitions dynamically
        <a
          className="heading-anchor"
          href="#load-definitions-dynamically"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Pass <code>definitionResolver</code> to <code>createLooms</code>,{' '}
        <code>createRuntime</code>, <code>createLocalActorHost</code>, or{' '}
        <code>LoomsDurableObject</code> when a definition is not in a module's{' '}
        <code>definitions</code> list. Use it for a database-backed catalog, multi-tenant configs, or
        historical versions kept out of the process binary. Module-registered definitions are
        checked first.
      </p>
      <p>
        <code>resolve(kind, name, version)</code> returns the full definition object, or{' '}
        <code>undefined</code> when that identity does not exist. Results, including misses, stay in
        an LRU cache. A fetch failure is <code>DefinitionResolveError</code> and is not cached. A
        miss fails start, spawn, or launch with <code>UnknownDefinitionError</code> and writes no
        events.
      </p>
      <CodeBlock lang="ts">{`import { Effect } from 'effect'
import { createLooms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'
import type { DefinitionResolver } from '@swirls/looms/core'

const checkoutV2 = defineWorkflow({
  name: 'checkout',
  version: 'v2',
  nodes: [{ id: 'charge', run: (input) => input }],
})

const definitionResolver: DefinitionResolver = {
  peek: () => undefined,
  resolve: (kind, name, version) =>
    Effect.sync(() =>
      kind === 'workflow' && name === 'checkout' && version === 'v2' ? checkoutV2 : undefined,
    ),
}

const looms = createLooms({
  modules: [workflow()],
  definitionResolver,
})

await looms.start(checkoutV2, { amount: 40 })`}</CodeBlock>
      <p>
        The accepted identity is pinned on <code>runtime.run.started</code> and{' '}
        <code>runtime.thread.started</code>. Before a wake replays a log, those pinned identities are
        resolved again so fold can read them synchronously. Return a definition the owning module's
        thread kind understands (a workflow object for <code>kind: 'workflow'</code>).{' '}
        <code>staticDefinitionResolver</code>, <code>chainDefinitionResolvers</code>, and{' '}
        <code>cachedDefinitionResolver</code> are in <code>@swirls/looms/core</code>; the host
        already chains the static list and an LRU in front of your option.
      </p>
      <p>
        <code>GET /definitions</code> lists module-registered definitions only. It does not
        enumerate a dynamic catalog.
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
