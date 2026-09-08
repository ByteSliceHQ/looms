import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/api')({
  component: Api,
})

function Api() {
  return (
    <>
      <h1>API / SDK</h1>
      <p>
        Entry points: <code>createLooms</code> from <code>@looms/runtime</code>,{' '}
        <code>createLoomsClient</code> from <code>@looms/client</code>, and{' '}
        <code>@looms/livestore/react</code> for the React client.
      </p>
      <h2>Packages</h2>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@looms/core</code>
            </td>
            <td>Events, reducers, definitions, memory EventStore</td>
          </tr>
          <tr>
            <td>
              <code>@looms/agent</code>
            </td>
            <td>Agent turn + tool execution</td>
          </tr>
          <tr>
            <td>
              <code>@looms/workflow</code>
            </td>
            <td>Workflow schedule + node execution</td>
          </tr>
          <tr>
            <td>
              <code>@looms/s2</code>
            </td>
            <td>S2 EventStore adapter</td>
          </tr>
          <tr>
            <td>
              <code>@looms/runtime</code>
            </td>
            <td>Wake loop, HTTP host, LiveStore proxy</td>
          </tr>
          <tr>
            <td>
              <code>@looms/client</code>
            </td>
            <td>
              HTTP client factory (<code>createLoomsClient</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/livestore</code>
            </td>
            <td>
              Materializers and light store; <code>/react</code> for full LiveStore
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/cli</code>
            </td>
            <td>
              <code>looms</code> CLI
            </td>
          </tr>
          <tr>
            <td>
              <code>@looms/projectors</code>
            </td>
            <td>
              <code>Projector</code> interface plus memory / Postgres / SQLite
              indexes. See <Link to="/docs/projectors">Projectors</Link>.
            </td>
          </tr>
        </tbody>
      </table>
      <h2>HTTP</h2>
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
              <code>/actors/agent</code>
            </td>
            <td>Start agent</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/actors/workflow</code>
            </td>
            <td>Start workflow</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/actors/:id/state</code>
            </td>
            <td>Reduced state</td>
          </tr>
          <tr>
            <td>GET</td>
            <td>
              <code>/actors/:id/events</code>
            </td>
            <td>Event log</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/actors/:id/signal</code>
            </td>
            <td>Append + wake</td>
          </tr>
          <tr>
            <td>POST</td>
            <td>
              <code>/actors/:id/reviews/:reviewId/decide</code>
            </td>
            <td>HITL</td>
          </tr>
          <tr>
            <td>*</td>
            <td>
              <code>/api/livestore</code>
            </td>
            <td>Pull/push proxy for clients</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
