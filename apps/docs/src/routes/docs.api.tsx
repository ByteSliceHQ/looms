import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'

export const Route = createFileRoute('/docs/api')({
  component: Api,
})

function Api() {
  return (
    <>
      <h1>API / SDK</h1>
      <p>
        Production hosts are <strong>actor cells</strong> — Cloudflare Durable Objects (
        <code>@looms/cloudflare</code>), celld with the same bundle, or{' '}
        <code>createLocalActorHost</code> locally. <code>createLooms</code> is the single-process
        embed API for scripts, tests, and small apps: start a definition, signal events, project
        read models, optionally serve HTTP.
      </p>

      <h2>Actor hosts (recommended)</h2>
      <p>
        See <Link to="/docs/durability">Durability &amp; Hosting</Link> for Durable Objects, celld,
        Bun SQLite actors, and bring-your-own single-writer hosts. Package entry points:
      </p>
      <ul>
        <li>
          <code>@looms/cloudflare</code> — <code>LoomsDurableObject</code>,{' '}
          <code>routeToDurableObject</code>
        </li>
        <li>
          <code>@looms/actor</code> — <code>createLocalActorHost</code>,{' '}
          <code>createActorCell</code>
        </li>
        <li>
          <code>@looms/core/bun-sqlite</code> — per-run SQLite <code>EventStore</code> for local
          actors
        </li>
      </ul>

      <h2>
        <code>createLooms</code>
      </h2>
      <CodeBlock lang="ts">{`import { agent } from '@looms/agent'
import { vercelLlm } from '@looms/ai-vercel'
import { approval } from '@looms/approval'
import { bunSqliteEventStore } from '@looms/core/bun-sqlite'
import { withProjectors } from '@looms/projectors'
import { createLooms } from '@looms/runtime'
import { s2Projector, s2ConfigFromEnv } from '@looms/s2'
import { workflow } from '@looms/workflow'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const llm = vercelLlm({
  model: createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY }).chat('openai/gpt-4o-mini'),
})

// Embed path: local SQLite storage with optional stream replication to an S2 lake.
const store = withProjectors(bunSqliteEventStore({ path: './looms.sqlite' }), [
  s2Projector(s2ConfigFromEnv(process.env)),
])

const looms = createLooms({
  definitions: [echo, checkout, assistant],
  modules: [agent({ llm }), workflow(), approval(), payments()],
  store,
  serve: { port: 8787 },
})`}</CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Default</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>definitions</code>
            </td>
            <td>
              <code>[]</code>
            </td>
            <td>
              Anything you can <code>start</code>: agents, workflows, or kinds from your own modules
            </td>
          </tr>
          <tr>
            <td>
              <code>modules</code>
            </td>
            <td>
              <code>[agent(), workflow(), approval()]</code>
            </td>
            <td>
              Configure a module (<code>agent({'{ llm }'})</code>), add domain modules, or drop ones
              you do not need
            </td>
          </tr>
          <tr>
            <td>
              <code>store</code>
            </td>
            <td>in-memory</td>
            <td>
              Execution <code>EventStore</code>. Use in-memory for tests or local SQLite for
              single-process persistence. For multi-run production durability, deploy virtual actor
              cells (Cloudflare Durable Objects).
            </td>
          </tr>
          <tr>
            <td>
              <code>snapshotEvery</code>
            </td>
            <td>
              <code>200</code>
            </td>
            <td>
              Durable events between mid-wake snapshots (<code>0</code> disables). Parking always
              snapshots.
            </td>
          </tr>
          <tr>
            <td>
              <code>serve</code>
            </td>
            <td>off</td>
            <td>Start the HTTP host immediately</td>
          </tr>
        </tbody>
      </table>
      <p>
        The LLM adapter lives on the agent module (<code>agent({'{ llm }'})</code>), not on the host
        — the host does not know what an agent is. Without one, agents run on a deterministic stub.
      </p>
      <p>Common methods:</p>
      <ul>
        <li>
          <code>start(definition, input)</code> — start any definition; the input type follows its
          schema. <code>startRun({'{ kind, definitionName, input }'})</code> when you only have
          names.
        </li>
        <li>
          <code>signal(runId, events)</code> — post events into a run. Modules ship builders:{' '}
          <code>userMessage()</code> from <code>@looms/agent</code>, <code>decision()</code> from{' '}
          <code>@looms/approval</code>.
        </li>
        <li>
          <code>getRun</code>, <code>getEvents</code>, <code>wake</code>
        </li>
        <li>
          <code>project(runId, conversation)</code> — fold a named read model
        </li>
        <li>
          <code>replayTo(runId, seq)</code> — state before and after an event
        </li>
        <li>
          <code>fetch(request)</code> — handle <code>/runs</code> and <code>/api/livestore</code>;
          returns <code>null</code> for other paths so you can mount Looms next to your own UI
        </li>
        <li>
          <code>serve()</code> / <code>stop()</code>
        </li>
      </ul>

      <h2>Packages</h2>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Import when you need</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@looms/runtime</code>
            </td>
            <td>
              <code>createLooms</code>, HTTP embed host
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/cloudflare</code>
            </td>
            <td>
              <code>LoomsDurableObject</code>, <code>routeToDurableObject</code> — recommended
              production host
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/actor</code>
            </td>
            <td>
              <code>createLocalActorHost</code>, <code>createActorCell</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/agent</code>
            </td>
            <td>
              <code>agent({'{ llm }'})</code>, <code>defineAgent</code>, <code>defineTool</code>,{' '}
              <code>conversation</code>, <code>userMessage</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/workflow</code>
            </td>
            <td>
              <code>defineWorkflow</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/approval</code>
            </td>
            <td>
              <code>gate</code>, <code>decision</code>, <code>pendingApprovals</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/core</code>
            </td>
            <td>
              <code>defineModule</code>, <code>defineEventCatalog</code>, <code>defineEffect</code>,{' '}
              <code>invoke</code>, <code>wait</code>, <code>defineThread</code>,{' '}
              <code>defineProjection</code>, <code>defineRuntimeModule</code>;{' '}
              <code>@looms/core/bun-sqlite</code> for local execution stores
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/client</code>
            </td>
            <td>Typed HTTP client from a browser or another service</td>
          </tr>
          <tr>
            <td>
              <code>@looms/livestore</code>
            </td>
            <td>
              <code>useRunStore</code>, <code>useProjection</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/s2</code>
            </td>
            <td>
              <code>s2Projector</code> — replicates committed events to a global S2 stream lake for
              centralized auditing and analytics. See <Link to="/docs/durability">Durability</Link>.
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/ai-vercel</code>
            </td>
            <td>Vercel AI SDK models</td>
          </tr>
          <tr>
            <td>
              <code>@looms/projectors</code>
            </td>
            <td>
              Cross-run indexes and fan-out. See <Link to="/docs/projectors">Projectors</Link>.
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/testing</code>
            </td>
            <td>
              <code>createTestRuntime</code>, replay checks
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/cli</code>
            </td>
            <td>Inspect and approve runs from a terminal</td>
          </tr>
        </tbody>
      </table>

      <h2>
        Core Module SDK (<code>@looms/core</code>)
      </h2>
      <p>
        Building blocks for authoring strongly typed runtime modules. See{' '}
        <Link to="/docs/modules">Modules</Link> for comprehensive guides.
      </p>
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>defineModule(options)</code>
            </td>
            <td>
              Create a typed module scope weaving a catalog into threads, projections, effects, and
              input/emit builders.
            </td>
          </tr>
          <tr>
            <td>
              <code>defineEventCatalog(namespace, entries)</code>
            </td>
            <td>
              Declare a namespaced event catalog backed by schemas (Zod, Effect Schema) or{' '}
              <code>payload&lt;T&gt;()</code> markers.
            </td>
          </tr>
          <tr>
            <td>
              <code>scope.effect(def)</code> / <code>defineEffect(def)</code>
            </td>
            <td>
              Define a host-side effect handler with input validation, idempotency key (
              <code>ctx.effectId</code>), retry policies, and typed returns/emit.
            </td>
          </tr>
          <tr>
            <td>
              <code>invoke(effectDef, input, tag?)</code>
            </td>
            <td>
              Request an effect invocation from a reducer or workflow. Statically verifies input
              against the effect&apos;s schema.
            </td>
          </tr>
          <tr>
            <td>
              <code>scope.thread(def)</code> / <code>defineThread(def)</code>
            </td>
            <td>
              Define a state machine thread kind. Narrow events and infer state across the module
              event universe.
            </td>
          </tr>
          <tr>
            <td>
              <code>scope.projection(def)</code> / <code>defineProjection(def)</code>
            </td>
            <td>
              Define a derived read model folded from the event stream. Narrow events automatically
              without manual type casting.
            </td>
          </tr>
          <tr>
            <td>
              <code>scope.input(key, payload)</code> / <code>scope.emit(key, payload)</code>
            </td>
            <td>
              Construct typed <code>EventInput</code> or <code>EmitEffect</code> instances matching
              catalog keys and payload schemas.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>HTTP</h2>
      <p>
        Point <code>createLoomsClient</code> or curl at a host. JSON in, JSON out. Actor / DO hosts
        return <code>501</code> for global <code>GET /runs</code> (cells are isolated per{' '}
        <code>runId</code>).
      </p>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GET</td>
            <td>
              <code>/health</code>
            </td>
            <td>Liveness</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/runs</code>
            </td>
            <td>
              Start a run: <code>{'{ kind, definitionName, input }'}</code>
            </td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/runs</code>
            </td>
            <td>
              List run ids on shared-store <code>createLooms</code> hosts; <code>501</code> on actor
              / DO / celld hosts
            </td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/runs/:id</code>
            </td>
            <td>Current run state</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/runs/:id/events</code>
            </td>
            <td>
              Event log. <code>?fromSeq=</code> for catch-up
            </td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/runs/:id/events</code>
            </td>
            <td>Signal the run (user message, approval, …)</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/runs/:id/threads</code>
            </td>
            <td>Child threads in the run</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/runs/:id/wake</code>
            </td>
            <td>Resume processing (timers, outstanding work)</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/runs/:id/replay?seq=</code>
            </td>
            <td>State before and after that event</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/runs/:id/projections/:name</code>
            </td>
            <td>
              Named projection (<code>conversation</code>, <code>ledger</code>, …)
            </td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/api/livestore</code>
            </td>
            <td>
              LiveStore pull (<code>?storeId=&cursor=</code>) or SSE (<code>live=true</code> /{' '}
              <code>Accept: text/event-stream</code>)
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Client helpers: <Link to="/docs/examples">Examples</Link>.
      </p>
    </>
  )
}
