import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/debugger')({
  head: () => pageHead('/docs/debugger'),
  component: Page,
})

function Page() {
  return (
    <>
      <h1>Debugger</h1>

      <p>
        The debugger lists a host&apos;s definitions, starts runs, and shows each run&apos;s thread
        tree, event log, state before and after each event, and projections. It uses the same HTTP
        API as your application.
      </p>
      <h2 id="serve-from-your-host">
        Serve it from your host
        <a
          className="heading-anchor"
          href="#serve-from-your-host"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        On Bun or Node, pass <code>debuggerUi()</code> to <code>createLooms</code> and open{' '}
        <code>/debugger</code> on that host. The page includes views for agents, workflows, and
        approvals.
      </p>
      <CodeBlock lang="ts">{`import { createLooms } from '@swirls/looms'
import { debuggerUi } from '@swirls/looms/debugger/server'

createLooms({
  modules,
  debugger: debuggerUi(),
  serve: true,
})`}</CodeBlock>
      <ul>
        <li>
          <code>path</code> sets the mount path. It defaults to <code>/debugger</code> and cannot
          overlap an API route such as <code>/runs</code>.
        </li>
        <li>
          <code>root</code> points at a built copy of the debugger app and defaults to the copy in
          the package. If the page responds with &quot;Debugger UI is not built&quot;,{' '}
          <code>root</code> has no <code>index.html</code>.
        </li>
      </ul>
      <p>
        <code>debuggerUi()</code> reads the app from disk. For Cloudflare Workers, see{' '}
        <a href="#durable-object-hosts">Durable Object hosts</a>.
      </p>
      <h2 id="control-access">
        Control access
        <a className="heading-anchor" href="#control-access" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Loading the page is a read of the route named <code>debugger</code>. The page then reads
        definitions, runs, and event streams. Starting, signaling, and waking a run are{' '}
        <code>write</code> routes. Chat messages and cancellation are signals. Without{' '}
        <code>authorize</code>, all of these are open. Leave them open only on a trusted local
        machine.
      </p>
      <p>
        The debugger sends no <code>Authorization</code> header, so bearer tokens on reads or writes
        lock it out. Check a session cookie instead:
      </p>
      <CodeBlock lang="ts">{`import { Effect } from 'effect'
import { authAllowed, authDenied, createLooms, defaultAuthorize, type Authorize } from '@swirls/looms'
import { debuggerUi } from '@swirls/looms/debugger/server'

const authorize: Authorize = (request, route) => {
  if (route.access !== 'read' && route.access !== 'write') {
    return defaultAuthorize(request, route)
  }

  // readSession is your application's cookie session lookup.
  return Effect.promise(() => readSession(request)).pipe(
    Effect.map((session) => (session?.isStaff ? authAllowed : authDenied(401, 'Sign in first'))),
  )
}

createLooms({ modules, authorize, debugger: debuggerUi(), serve: true })`}</CodeBlock>
      <p>
        See <Link to="/docs/security">authentication and tenancy</Link> for per-run ownership
        checks.
      </p>
      <h2 id="add-views-for-your-modules">
        Add views for your modules
        <a
          className="heading-anchor"
          href="#add-views-for-your-modules"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        Without a plugin, the debugger shows your module&apos;s events by type, its projections as
        JSON, and a form built from each definition&apos;s input schema. A{' '}
        <code>DebuggerPlugin</code> replaces those defaults with your own summaries and components.
        Export it from a <code>/debugger</code> subpath so a Worker or other headless host can
        import the module root without React.
      </p>
      <CodeBlock lang="tsx">{`import { jsonFields, jsonText, type DebuggerPlugin } from '@swirls/looms/debugger'

import { invoices } from '../projections'
import { BillingRun } from './billing-run'
import { InvoicesView } from './invoices-view'

export const billingDebugger: DebuggerPlugin = {
  name: 'billing',
  families: [
    {
      family: 'billing',
      color: 'oklch(0.78 0.1 175)',
      summarize: (event) =>
        event.type === 'billing.invoice.paid'
          ? { title: 'invoice paid', detail: jsonText(jsonFields(event.payload).invoiceId) }
          : undefined,
    },
  ],
  workspace: { kinds: ['billing'], component: BillingRun },
  projections: [{ name: invoices.name, component: InvoicesView }],
}`}</CodeBlock>
      <ul>
        <li>
          <code>families</code> claims events whose type starts with <code>{'<family>.'}</code>, or
          with <code>prefix</code> when set. The longest matching prefix supplies the color and
          summary. When <code>summarize</code> returns <code>undefined</code>, the row shows the
          event type and a compact payload.
        </li>
        <li>
          <code>workspace</code> renders the middle column for definitions whose <code>kind</code>{' '}
          is listed. Set <code>matches</code> when only some definitions of that kind should use it.
          It receives the definition, the selected run ID, and <code>onStarted</code> for runs it
          starts. Definitions it does not claim keep the schema form for the whole run.
        </li>
        <li>
          <code>projections</code> names a projection and a component. The component receives the
          run ID and reads that projection itself.
        </li>
      </ul>
      <p>
        The app that <code>debuggerUi()</code> serves is prebuilt with the agent, workflow, and
        approval plugins only. To see your own plugin, render the debugger in your application.
      </p>
      <h2 id="render-in-your-application">
        Render it in your application
        <a
          className="heading-anchor"
          href="#render-in-your-application"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        <code>DebuggerShell</code> is the same component the hosted page renders. Pass the plugins
        you want and keep the selection in your router so reloads and shared links open the same
        run.
      </p>
      <CodeBlock lang="tsx">{`import { agentDebugger } from '@swirls/looms/agent/debugger'
import { approvalDebugger } from '@swirls/looms/approval/debugger'
import { DebuggerShell, type DebuggerSelection } from '@swirls/looms/debugger'
import { workflowDebugger } from '@swirls/looms/workflow/debugger'

import { billingDebugger } from './billing/debugger'

const plugins = [agentDebugger, workflowDebugger, approvalDebugger, billingDebugger]

export function DebuggerPage({ selection, onSelectionChange }: {
  selection: DebuggerSelection
  onSelectionChange: (selection: DebuggerSelection) => void
}) {
  return (
    <div className="h-dvh">
      <DebuggerShell
        plugins={plugins}
        selection={selection}
        onSelectionChange={onSelectionChange}
        endpoint="/api/looms"
      />
    </div>
  )
}`}</CodeBlock>
      <ul>
        <li>
          <code>selection</code> holds <code>kind</code>, <code>name</code>, <code>run</code>,{' '}
          <code>thread</code>, and <code>seq</code>. Map them to URL search parameters.
        </li>
        <li>
          <code>endpoint</code> is prepended to every API path. It defaults to the page origin.
          Looms does not send CORS headers, so serve the API from the page&apos;s origin, directly
          or through a proxy.
        </li>
        <li>The shell fills its parent. Give the parent a height.</li>
        <li>
          The shell uses <code>localStorage</code> and <code>EventSource</code>. Render it only in
          the browser, for example by turning off server rendering for that route.
        </li>
      </ul>
      <p>
        The styles need Tailwind CSS v4. Import the debugger stylesheet after Tailwind. It already
        scans the debugger and the built-in module views. Add an <code>@source</code> line, relative
        to your stylesheet, for each of your own plugins:
      </p>
      <CodeBlock lang="css">{`@import 'tailwindcss';
@import '@swirls/looms/debugger/styles.css';
@source '../src/billing/debugger';`}</CodeBlock>
      <p>
        The stylesheet defines a dark theme with shadcn/ui variable names such as{' '}
        <code>--background</code>, <code>--card</code>, and <code>--border</code>. It defines them
        in a cascade layer, so variables your app sets on <code>:root</code> outside a layer take
        precedence. A shadcn/ui app&apos;s theme applies to the debugger without changes.
      </p>
      <h2 id="durable-object-hosts">
        Durable Object hosts
        <a
          className="heading-anchor"
          href="#durable-object-hosts"
          aria-label="Link to this section"
        >
          #
        </a>
      </h2>
      <p>
        <code>debuggerUi()</code> reads the app from the installed package, and a Worker bundle does
        not include those files. The Durable Object router also returns 501 for{' '}
        <code>GET /runs</code> and does not route <code>/definitions</code>, because neither belongs
        to a single run. A debugger pointed at a Worker has no run types to start and no runs to
        search.
      </p>
      <p>
        To start and inspect runs during development, load the same modules into a local Bun host
        with <code>debuggerUi()</code>. The{' '}
        <Link to="/docs/hosting-and-storage" hash="bun">
          hosting guide
        </Link>{' '}
        covers the Bun setup.
      </p>
    </>
  )
}
