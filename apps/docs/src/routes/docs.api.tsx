import { createFileRoute, Link } from '@tanstack/react-router'

import runtimeSource from '../../../../packages/runtime/src/looms.ts?raw'
import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/api')({
  head: () => pageHead('/docs/api'),
  component: Api,
})

const options = runtimeSource.slice(
  runtimeSource.indexOf('export interface CreateLoomsOptions'),
  runtimeSource.indexOf('export interface StartResult'),
)

const signatures = runtimeSource.slice(
  runtimeSource.indexOf('export interface StartResult'),
  runtimeSource.indexOf('interface Initialized'),
)

function Api() {
  return (
    <>
      <h1>API reference</h1>
      <p>
        The embed API runs within one process. Actor hosts expose a similar HTTP contract with one
        writer per run. Signatures below are extracted from the runtime source; the client returns
        HTTP response envelopes rather than exactly the same shapes as embed methods.
      </p>
      <h2 id="create">
        Create a runtime
        <a className="heading-anchor" href="#create" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="ts">{`import { createLooms } from '@looms/runtime'
import { modules, release } from './review-definition'

const looms = createLooms({ modules })
try {
  const { runId, state } = await looms.start(release, { topic: 'Launch' })
  console.log(runId, state.status)
} finally {
  await looms.stop()
}`}</CodeBlock>
      <p>
        This uses the quickstart definition and an in-memory store. Pass a persistent store before
        relying on restart recovery. Nothing is installed by default: modules defaults to an empty
        list, store to memory, and serve to off.
      </p>
      <CodeBlock lang="ts" code={options} />
      <p>
        snapshotEvery defaults to 200 durable events; zero disables mid-wake snapshots, while
        parking still snapshots. runCacheSize defaults to zero. maxWakeIterations defaults to 100
        and bounds a wake cycle, not application cost. The default scheduler uses process-local
        timers. trimAfterSnapshot is opt-in and can remove historical replay data.
      </p>
      <h2 id="methods">
        Embed methods and return types
        <a className="heading-anchor" href="#methods" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="ts" code={signatures} />
      <h3 id="start">
        start and startRun
        <a className="heading-anchor" href="#start" aria-label="Link to this section">
          #
        </a>
      </h3>
      <p>
        start infers input from a definition; startRun accepts registered names. Both run a wake
        cycle and resolve with runId, threadId, and state. Resolution is not a promise that all
        business work is complete: a gate or child may still be pending. They reject on invalid
        input, missing definitions, storage failures, or execution limits.
      </p>
      <p>
        Use a stable runId and idempotencyKey when retrying creation of the same logical run.
        Generating a new runId on every retry creates a different run. Register all definitions
        before starting or spawning them.
      </p>
      <h3 id="signal">
        signal, wake, and cancel
        <a className="heading-anchor" href="#signal" aria-label="Link to this section">
          #
        </a>
      </h3>
      <p>
        signal validates and appends inputs, then wakes execution and returns state. Its optional
        idempotencyKey identifies retries of the same request within a run. wake processes pending
        work without inventing a new domain signal. cancel records cancellation for a run or thread;
        it cannot undo an external action.
      </p>
      <h3 id="read">
        Read and inspect
        <a className="heading-anchor" href="#read" aria-label="Link to this section">
          #
        </a>
      </h3>
      <p>
        getRun returns folded RunState. getEvents returns recorded envelopes ordered by sequence,
        with optional fromSeq and limit. project folds a projection and returns its state. replayTo
        returns before/after state at a sequence, or null when no matching step is available; it
        does not execute effects.
      </p>
      <p>
        ready initializes storage and modules. rescanTimers re-registers persisted timers on the
        configured scheduler. fetch returns a Response or null for unhandled paths. serve starts the
        Bun HTTP server. stop disposes the runtime scheduler and any server it started; it is not an
        application-level cancellation or a database backup.
      </p>
      <h2 id="http">
        HTTP contract
        <a className="heading-anchor" href="#http" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Put authentication and authorization ahead of every route, including event streams. JSON
        requests use content-type: application/json.
      </p>
      <CodeBlock lang="text">{`GET  /health                         → { ok: true }
POST /runs                           → { runId, threadId, state }
GET  /runs                           → { runIds } (embed only)
GET  /runs/:id                       → { runId, state }
GET  /runs/:id/events                → { runId, events }
POST /runs/:id/events                → { runId, state }
GET  /runs/:id/threads               → { runId, threads }
POST /runs/:id/wake                  → { runId, state }
GET  /runs/:id/replay?seq=10          → { runId, step }
GET  /runs/:id/projections/:name      → { runId, name, value }
GET  /api/events?runId=ID&live=true   → SSE`}</CodeBlock>
      <p>
        POST /runs accepts kind, definitionName, input, and optionally runId and idempotencyKey.
        POST /runs/:id/events accepts an events array and optionally idempotencyKey. The embed
        handler also recognizes the Idempotency-Key header. GET event history supports fromSeq and
        limit; SSE uses cursor and Last-Event-ID for catch-up.
      </p>
      <CodeBlock lang="bash">{`curl -X POST http://localhost:8787/runs \\
  -H 'content-type: application/json' \\
  -d '{"kind":"workflow","definitionName":"release-v1","input":{"topic":"Launch"}}'`}</CodeBlock>
      <p>
        Actor hosts return 501 for global GET /runs; use an application registry or shared index.
        The embed handler maps InvalidInputError and InvalidEventError to 400, unknown projections
        to 404, and other caught execution failures to 500. Routing behavior differs by host;
        inspect status and body. Client request helpers reject non-success responses. Cancellation
        is currently an embed runtime method, not a client HTTP endpoint.
      </p>
      <h2 id="client">
        Client and streaming
        <a className="heading-anchor" href="#client" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        createLoomsClient accepts baseUrl and an optional fetch implementation. getRun and signal
        resolve to objects containing state; getEvents resolves to an object containing events.
        subscribeEvents returns an unsubscribe function and reconnects using its last cursor.
        stream(definition, input) or streamRun(args) returns an async iterable with a runId for
        events during the initial wake cycle. A stream ending does not mean a parked workflow has
        finished.
      </p>
      <p>
        The current client start/signal helpers do not expose every embed idempotency option. For
        retry-sensitive requests, use an application endpoint or explicit HTTP bodies/headers with
        stable operation identifiers. See <Link to="/docs/integration">integration</Link>.
      </p>
      <h2 id="packages">
        Packages and extension APIs
        <a className="heading-anchor" href="#packages" aria-label="Link to this section">
          #
        </a>
      </h2>
      <ul>
        <li>
          <code>@looms/core</code>: defineModule, defineEventCatalog, defineThread, defineEffect,
          defineProjection; invoke, spawn, wait, emit, complete, fail. The bun-sqlite entry supplies
          Bun storage.
        </li>
        <li>
          <code>@looms/runtime</code>: createLooms and lower-level runtime APIs.
        </li>
        <li>
          <code>@looms/agent</code>: agent, defineAgent, defineTool, asThreadTool, asAgentTool,
          asWorkflowTool, conversation, userMessage.
        </li>
        <li>
          <code>@looms/workflow</code>: workflow and defineWorkflow.
        </li>
        <li>
          <code>@looms/approval</code>: approval, gate, decision, pendingApprovals.
        </li>
        <li>
          <code>@looms/actor</code>: createActorCell and createLocalActorHost.
        </li>
        <li>
          <code>@looms/cloudflare</code>: LoomsDurableObject and routeToDurableObject.
        </li>
        <li>
          <code>@looms/client</code> and <code>@looms/react</code>: HTTP clients, streams,
          providers, and projection hooks.
        </li>
        <li>
          <code>@looms/ai-vercel</code>: vercelLlm for AI SDK model providers.
        </li>
        <li>
          <code>@looms/projectors</code>: post-commit indexes and fan-out. <code>@looms/s2</code>:
          stream replication.
        </li>
        <li>
          <code>@looms/testing</code>: deterministic in-memory helpers and conformance checks.
        </li>
        <li>
          <code>@looms/cli</code> and <code>@looms/debugger</code>: inspection tools.
        </li>
      </ul>
      <p>
        For module authoring, see <Link to="/docs/modules">custom modules</Link>. For agent options
        and tools, see <Link to="/docs/agents">agents</Link>. Package type declarations remain the
        exhaustive reference for lower-level interfaces.
      </p>
    </>
  )
}
