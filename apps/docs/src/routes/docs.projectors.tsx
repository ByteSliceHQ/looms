import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/projectors')({
  component: Projectors,
})

function Projectors() {
  return (
    <>
      <h1>Projectors</h1>
      <p>
        A run&apos;s event log is the source of truth. A projector watches that log
        and writes a query surface you can rebuild: lists, search, webhooks,
        warehouses.
      </p>
      <p>Use one when you need to ask questions a single run log cannot answer:</p>
      <ul>
        <li>list runs or threads by status, kind, or definition</li>
        <li>show pending approvals across the whole host</li>
        <li>fan out to a search index or Slack</li>
        <li>drive an admin UI that is not subscribed to one run</li>
      </ul>
      <p>
        For a single-run UI — chat, debugger, ledger — fold the log in the browser
        with <code>useProjection</code>. See <Link to="/docs/examples">Examples</Link>.
      </p>

      <h2>Attach them to the host</h2>
      <p>
        Wrap the event store with <code>withProjectors</code>. Events are delivered
        in log order after each append. A failing projector does not roll back the
        log; override that with <code>onError</code> if you need to alert.
      </p>
      <pre>
        <code>{`import { withProjectors } from '@looms/projectors'
import { sqlite } from '@looms/projectors/sqlite'
import { createLooms } from '@looms/runtime'
import { s2, s2ConfigFromEnv } from '@looms/s2'

const looms = createLooms({
  definitions,
  store: withProjectors(s2(s2ConfigFromEnv(process.env)), [sqlite({ path: './looms.db' })], {
    onError: (error, projector) => {
      console.warn(projector.name, error.message)
    },
  }),
})`}</code>
      </pre>

      <h2>Built-in indexes</h2>
      <p>
        Memory, SQLite, and Postgres helpers keep a run index and an approval index
        up to date as events append. Query them from your admin routes.
      </p>
      <table>
        <thead>
          <tr>
            <th>Helper</th>
            <th>Import</th>
            <th>When to use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>memory()</code>
            </td>
            <td>
              <code>@looms/projectors</code>
            </td>
            <td>Tests and single-process hosts</td>
          </tr>
          <tr>
            <td>
              <code>sqlite(opts)</code>
            </td>
            <td>
              <code>@looms/projectors/sqlite</code>
            </td>
            <td>
              File path or an existing <code>db</code>. Defaults to{' '}
              <code>:memory:</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>postgres(opts)</code>
            </td>
            <td>
              <code>@looms/projectors/postgres</code>
            </td>
            <td>
              Pass <code>{'{ url }'}</code> or an existing postgres.js{' '}
              <code>{'{ sql }'}</code>
            </td>
          </tr>
        </tbody>
      </table>
      <pre>
        <code>{`import { memory } from '@looms/projectors'
import { postgres } from '@looms/projectors/postgres'
import { sqlite } from '@looms/projectors/sqlite'

const index = sqlite({ path: './looms.db' })
const run = await index.getActor(runId)
const pending = await index.listReviews(runId)`}</code>
      </pre>

      <h2>Webhook or search</h2>
      <p>
        Any object with <code>project(events)</code> works. Keep it idempotent — a
        batch can be delivered more than once.
      </p>
      <pre>
        <code>{`import type { Projector } from '@looms/projectors'

export function approvalsWebhook(url: string): Projector {
  return {
    name: 'approvals-webhook',
    project: async (events) => {
      for (const event of events) {
        if (event.type !== 'approval.requested') continue
        await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            runId: event.runId,
            approvalId: event.payload.approvalId,
            title: event.payload.title,
          }),
        })
      }
    },
  }
}`}</code>
      </pre>
      <p>
        Optional <code>init</code> opens connections or creates tables.{' '}
        <code>dispose</code> closes them.
      </p>
    </>
  )
}
