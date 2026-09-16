import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/integration')({
  head: () => pageHead('/docs/integration'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Add Looms to your app</h1>

      <p>
        Keep your application router, authentication, database, and model provider. Choose which
        long-running operation becomes a Looms run, and store its runId beside the application
        record that owns it.
      </p>
      <h2 id="choose-a-boundary">
        Choose a boundary
        <a className="heading-anchor" href="#choose-a-boundary" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Use one run for a coherent operation such as a support investigation or procurement request.
        Its child agents, workflows, and custom threads share one history. Keep independent
        customers and operations in separate runs. Actor isolation does not replace tenant
        authorization.
      </p>
      <h2 id="install-only-the-capabilities-you-need">
        Install only the capabilities you need
        <a
          className="heading-anchor"
          href="#install-only-the-capabilities-you-need"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <CodeBlock lang="bash">{`npm install @looms/client
# React application:
npm install @looms/react @looms/agent @looms/approval
# Host with workflow and approval support:
npm install @looms/runtime @looms/workflow @looms/approval`}</CodeBlock>
      <p>
        Register every named child definition on its owning module. A reference used as a tool does
        not automatically register the child. Keep server-only provider configuration and secrets
        out of client imports; export event catalogs and projections from separate shared files.
      </p>
      <h2 id="mount-behind-your-application-gateway">
        Mount behind your application gateway
        <a
          className="heading-anchor"
          href="#mount-behind-your-application-gateway"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        After authenticating and authorizing a request, forward it to an actor host or call{' '}
        <code>looms.fetch(request)</code>. The embed handler returns null for unrelated paths. Keep
        the documented paths intact when forwarding, including <code>/api/events</code>. Do not
        expose raw event ingestion directly to untrusted browsers.
      </p>
      <CodeBlock lang="ts">{`// Fragment inside an already-authorized server handler:
const response = await looms.fetch(request)
return response ?? new Response('Not found', { status: 404 })`}</CodeBlock>
      <h2 id="connect-a-client">
        Connect a client
        <a className="heading-anchor" href="#connect-a-client" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="ts">{`import { createLoomsClient } from '@looms/client'

const client = createLoomsClient({ baseUrl: '/execution' })
const { runId } = await client.startRun({
  kind: 'workflow',
  definitionName: 'release-v1',
  input: { topic: 'Product launch' },
})
const unsubscribe = client.subscribeEvents(runId, (event) => {
  console.log(event.seq, event.type)
})
// On disposal:
unsubscribe()`}</CodeBlock>
      <p>
        This assumes your same-origin gateway strips <code>/execution</code> before forwarding and
        checks both run ownership and allowed actions. Use a custom fetch implementation for
        service-to-service authentication. Preserve streaming responses and disable proxy buffering
        for SSE.
      </p>
      <h2 id="connect-react">
        Connect React
        <a className="heading-anchor" href="#connect-react" aria-label="Link to this section">
          #
        </a>
      </h2>
      <CodeBlock lang="tsx">{`import { LoomsProvider, useProjection, useRunStore } from '@looms/react'
import { pendingApprovals } from '@looms/approval'

function Reviews({ runId }: { runId: string }) {
  const store = useRunStore(runId)
  const reviews = useProjection(store, pendingApprovals)
  return <p>{reviews.items.filter((r) => r.status === 'pending').length} pending reviews</p>
}

export function App({ runId }: { runId: string }) {
  return <LoomsProvider endpoint="/execution"><Reviews runId={runId} /></LoomsProvider>
}`}</CodeBlock>
      <p>
        Handle decisions through an application endpoint that authorizes the reviewer and constructs
        the allowed event. See <Link to="/docs/security">authentication and tenancy</Link> before
        connecting real users.
      </p>
      <h2 id="keep-your-agent-logic">
        Keep your agent logic
        <a
          className="heading-anchor"
          href="#keep-your-agent-logic"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Use <code>{'defineAgent({ runTurn })'}</code> to adapt one turn of an existing
        implementation. Return the assistant message, tool requests, and completion state. The turn
        can be retried after an interruption; do not hide irreversible operations inside it. Use
        typed tools or domain effects for those operations.
      </p>
    </>
  )
}
