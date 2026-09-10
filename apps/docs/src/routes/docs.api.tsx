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
        Start with <code>createLooms</code> from <code>@looms/runtime</code>. It registers agents,
        workflows, approvals, and any extra modules you pass, then gives you a host you can call
        in-process or over HTTP.
      </p>

      <h2>
        <code>createLooms</code>
      </h2>
      <CodeBlock lang="ts">{`import { agent } from '@looms/agent'
import { vercelLlm } from '@looms/ai-vercel'
import { approval } from '@looms/approval'
import { createLooms } from '@looms/runtime'
import { s2, s2ConfigFromEnv } from '@looms/s2'
import { workflow } from '@looms/workflow'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const llm = vercelLlm({
  model: createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY }).chat('openai/gpt-4o-mini'),
})

const looms = createLooms({
  definitions: [echo, checkout, assistant],
  modules: [agent({ llm }), workflow(), approval(), payments()],
  store: s2(s2ConfigFromEnv(process.env)),
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
              Durable log via <code>@looms/s2</code>, or wrap with{' '}
              <Link to="/docs/projectors">projectors</Link>
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
              <code>createLooms</code>, HTTP host
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
              <code>defineRuntimeModule</code>, <code>defineEffect</code>, <code>invoke</code>,{' '}
              <code>wait</code>
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
            <td>Durable event log</td>
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
              Cross-run indexes. See <Link to="/docs/projectors">Projectors</Link>.
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

      <h2>HTTP</h2>
      <p>
        Point <code>createLoomsClient</code> or curl at a host. JSON in, JSON out.
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
            <td>List run ids</td>
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
