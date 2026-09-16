import { createFileRoute, Link } from '@tanstack/react-router'

import workerSource from '../../../../examples/cloudflare/worker.ts?raw'
import workerConfig from '../../../../examples/cloudflare/wrangler.jsonc?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/hosting-and-storage')({
  head: () => pageHead('/docs/hosting-and-storage'),
  component: HostingAndStorage,
})

function HostingAndStorage() {
  return (
    <>
      <h1>Hosting &amp; storage</h1>
      <p>
        Choose storage that survives your host, keep one writer per run, and arrange how parked work
        wakes. Cloudflare Durable Objects supply per-run SQLite and durable alarms. Local Bun hosts
        are useful for development and services where you operate those responsibilities.
      </p>
      <h2 id="cloudflare">
        Run the quickstart on Cloudflare
        <a className="heading-anchor" href="#cloudflare" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Start with <code>review-definition.ts</code> from the{' '}
        <Link to="/docs/quickstart">quickstart</Link>. The same agent, workflow, and approval
        modules run inside a Durable Object. This example uses deterministic tools and simulated
        publication, so it requires no model API key.
      </p>
      <CodeBlock lang="bash">{`npm install @looms/cloudflare @looms/agent @looms/workflow @looms/approval zod
npm install --save-dev wrangler typescript @types/bun
mkdir cloudflare`}</CodeBlock>
      <p>
        Save this as <code>cloudflare/worker.ts</code>. The environment type is generated from the
        configuration below.
      </p>
      <CodeBlock lang="ts" code={workerSource} />
      <p>
        Save this as <code>cloudflare/wrangler.jsonc</code>. The migration creates SQLite-backed
        objects. Keep migration history when changing an existing deployment; do not replace it with
        a new initial migration.
      </p>
      <CodeBlock lang="jsonc" code={workerConfig} />
      <p>
        The Worker has no public route, workers.dev address, or preview URL. Deploy it as a private
        service and call it from your application Worker after authentication and per-run
        authorization. Disabling public URLs does not implement tenant authorization inside your
        application.
      </p>
      <CodeBlock lang="bash">{`npx wrangler types --config cloudflare/wrangler.jsonc cloudflare/worker-configuration.d.ts
npx wrangler dev --config cloudflare/wrangler.jsonc --port 8791`}</CodeBlock>
      <p>
        Wrangler serves the API locally and persists development storage under{' '}
        <code>.wrangler</code>. In another terminal, create a run and keep the returned runId:
      </p>
      <CodeBlock lang="bash">{`curl -X POST http://localhost:8791/runs \\
  -H 'content-type: application/json' \\
  -d '{"kind":"workflow","definitionName":"release-v1","input":{"topic":"Launch"}}'

curl http://localhost:8791/runs/RUN_ID/projections/pendingApprovals`}</CodeBlock>
      <p>
        Stop Wrangler, start it again with the same configuration, and read that pending approval
        again. Replace RUN_ID with the returned identifier. Inspect the events or send an approval
        decision through the <Link to="/docs/api">HTTP API</Link>; the{' '}
        <Link to="/docs/integration">client guide</Link> covers application integration.
      </p>
      <h2 id="deploy">
        Deploy a private execution service
        <a className="heading-anchor" href="#deploy" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Choose a unique Worker name, validate the bundle, and deploy to your Cloudflare account.
        This provisions Durable Object storage. Use a separate Worker name and namespace for
        staging.
      </p>
      <CodeBlock lang="bash">{`npx wrangler deploy --dry-run --config cloudflare/wrangler.jsonc
npx wrangler login
npx wrangler deploy --config cloudflare/wrangler.jsonc`}</CodeBlock>
      <p>Add a service binding in your calling application's Wrangler configuration:</p>
      <CodeBlock lang="jsonc">{`{
  "services": [{ "binding": "EXECUTION", "service": "looms-review" }]
}`}</CodeBlock>
      <p>
        After validating the current user's permission for the operation and run, forward a Request
        through <code>env.EXECUTION.fetch(request)</code>. Use the Looms route path, such as{' '}
        <code>/runs/:id/events</code>, even if your application exposes it at a different prefix.
        Apply the same checks to SSE and read endpoints.
      </p>
      <p>
        For a real model, configure the provider adapter in the Worker and store credentials with{' '}
        <code>npx wrangler secret put OPENROUTER_API_KEY --config cloudflare/wrangler.jsonc</code>.
        Add local credentials to an ignored <code>cloudflare/.dev.vars</code>. Never place provider
        keys in browser code. See <Link to="/docs/agents">model integration</Link> and Cloudflare's{' '}
        <a href="https://developers.cloudflare.com/durable-objects/get-started/">
          Durable Objects guide
        </a>
        .
      </p>
      <h2 id="bun">
        Host within a Bun application
        <a className="heading-anchor" href="#bun" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        For a local HTTP host, install <code>@looms/actor</code> and <code>@looms/core</code>, then
        use the quickstart's modules. This complete server binds to localhost:
      </p>
      <CodeBlock lang="ts">{`import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createLocalActorHost } from '@looms/actor'
import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { modules } from './review-definition'

const runsDir = join(process.cwd(), '.looms', 'runs')
await mkdir(runsDir, { recursive: true })
const host = createLocalActorHost({
  modules,
  createStore: async (runId) => bunSqliteEventStore({
    path: join(runsDir, encodeURIComponent(runId) + '.sqlite'),
  }),
})
Bun.serve({ hostname: '127.0.0.1', port: 8791, fetch: (request) => host.fetch(request) })`}</CodeBlock>
      <p>
        Keep the database directory on persistent storage and run one host for those files. The
        local host rescans timers when a run cell opens; it does not discover every database on
        startup. Maintain a run index and reopen runs at boot for unattended timer recovery. Durable
        Objects provide host-managed alarms.
      </p>
      <h2 id="recovery">
        Snapshots, recovery, and retention
        <a className="heading-anchor" href="#recovery" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Actor cells recover from a snapshot plus subsequent events. A parked wake cycle writes a
        snapshot; snapshotEvery defaults to 200 durable events for checkpoints during a wake.
        Recovery time depends on history size, reducers, and host conditions.
      </p>
      <p>
        trimAfterSnapshot can prune events needed by historical replay and rebuilding projections.
        Establish retention and backup requirements first. Post-commit projectors can build
        cross-run indexes and archives, but downstream failures require their own monitoring and
        recovery policy. See <Link to="/docs/operations">operations</Link> and{' '}
        <Link to="/docs/reliability">reliability</Link>.
      </p>
      <h2 id="other-hosts">
        Other hosts
        <a className="heading-anchor" href="#other-hosts" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        createLooms defaults to an in-memory store; the quickstart configures SQLite explicitly. For
        another actor platform, use createActorCell and supply storage and wake scheduling while
        preserving one writer per run. Compatibility with self-hosted Workers runtimes such as celld
        needs validation against a specific version; this guide does not provide a verified celld
        deployment.
      </p>
      <p>
        Parking does not imply zero hosting cost. Account for stored events, requests, alarms, and
        connected clients when estimating capacity.
      </p>
    </>
  )
}
