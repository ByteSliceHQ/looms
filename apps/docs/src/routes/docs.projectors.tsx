import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/projectors')({
  component: Projectors,
})

function Projectors() {
  return (
    <>
      <h1>Projectors</h1>
      <p>
        A projector is a host-side subscriber that writes a secondary index as
        events append to the log. The <code>EventStore</code> stays the source of
        truth. Projectors never become the durable record — they are query
        surfaces you can rebuild.
      </p>
      <p>Use one when you need to ask questions the log is a poor fit for:</p>
      <ul>
        <li>list actors by status, definition, or parent</li>
        <li>show pending reviews across the host</li>
        <li>fan out to a search index, warehouse, or webhook</li>
        <li>drive an admin UI that is not LiveStore</li>
      </ul>
      <p>
        Client UIs that follow a single actor should keep using{' '}
        <code>@looms/livestore</code>. Projectors run on the host, after each
        successful <code>append</code>.
      </p>

      <h2>Wire them into the host</h2>
      <p>
        Pass any number of projectors to <code>createLooms</code>. The runtime
        calls <code>init</code> before the first batch, delivers events in log
        order after each append, and calls <code>dispose</code> on{' '}
        <code>stop()</code>. A throwing projector is isolated — the log still
        commits. Override that with <code>onProjectorError</code>.
      </p>
      <pre>
        <code>{`import { createLooms } from '@looms/runtime'
import { sqlite } from '@looms/projectors/sqlite'

const looms = createLooms({
  definitions,
  projectors: [sqlite({ path: './looms.db' })],
  onProjectorError: (error, projector) => {
    console.warn(projector.name, error.message)
  },
})`}</code>
      </pre>

      <h2>Built-in indexes</h2>
      <p>
        <code>@looms/projectors</code> ships an actor/review index. All three
        backends share the same semantics:{' '}
        <code>actor.started</code> upserts the actor, terminal actor events set
        status, <code>review.requested</code> marks the actor{' '}
        <code>waiting_review</code>, and review decisions map{' '}
        <code>approve</code> / <code>reject</code> to{' '}
        <code>approved</code> / <code>rejected</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Helper</th>
            <th>Import</th>
            <th>Options</th>
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
            <td>In-process Maps. Good for tests.</td>
          </tr>
          <tr>
            <td>
              <code>sqlite(opts)</code>
            </td>
            <td>
              <code>@looms/projectors/sqlite</code>
            </td>
            <td>
              <code>{'{ path }'}</code> or <code>{'{ db }'}</code>. Path defaults
              to <code>:memory:</code>.
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
              <code>{'{ url }'}</code> or an existing postgres.js{' '}
              <code>{'{ sql }'}</code>. No env lookup — pass the URL yourself.
            </td>
          </tr>
        </tbody>
      </table>
      <pre>
        <code>{`import { memory } from '@looms/projectors'
import { postgres } from '@looms/projectors/postgres'
import { sqlite } from '@looms/projectors/sqlite'

memory()
sqlite({ path: './looms.db' })
postgres({ url })`}</code>
      </pre>
      <p>
        Index projectors also expose <code>getActor(actorId)</code> and{' '}
        <code>listReviews(actorId?)</code>.
      </p>

      <h2>Implement a projector</h2>
      <p>
        Anything that satisfies <code>Projector</code> works. Keep{' '}
        <code>project</code> idempotent — a batch can be redelivered.
      </p>
      <pre>
        <code>{`import type { Projector } from '@looms/projectors'

export function reviewsWebhook(url: string): Projector {
  return {
    name: 'reviews-webhook',
    project: async (events) => {
      for (const event of events) {
        if (event.type !== 'review.requested') continue
        await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            actorId: event.actorId,
            reviewId: event.payload.reviewId,
            title: event.payload.title,
          }),
        })
      }
    },
  }
}`}</code>
      </pre>
      <p>
        <code>init</code> is for opening connections or creating tables.{' '}
        <code>dispose</code> closes what you opened. <code>name</code> shows up
        in error reports.
      </p>

      <h2>Reuse the actor/review model</h2>
      <p>
        To put the same index on another store, implement{' '}
        <code>IndexBackend</code> and wrap it with{' '}
        <code>createIndexProjector</code>. <code>indexOpsFor(event)</code> is the
        pure reducer the built-in backends already use.
      </p>
      <pre>
        <code>{`import {
  createIndexProjector,
  indexOpsFor,
  type IndexBackend,
  type IndexOp,
} from '@looms/projectors'

const backend: IndexBackend = {
  applyOps: async (ops: ReadonlyArray<IndexOp>) => {
    for (const op of ops) {
      // write to Redis, Elasticsearch, …
    }
  },
  getActor: async (actorId) => null,
  listReviews: async () => [],
}

export const searchIndex = createIndexProjector('search', backend)`}</code>
      </pre>
    </>
  )
}
