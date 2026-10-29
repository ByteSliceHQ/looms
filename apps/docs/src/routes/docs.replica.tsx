import { createFileRoute, Link } from '@tanstack/react-router'

import { CodeBlock } from '../components/code-block'
import { pageHead } from '../page-head'

export const Route = createFileRoute('/docs/replica')({
  head: () => pageHead('/docs/replica'),
  component: Replica,
})

function Replica() {
  return (
    <>
      <h1>Replicate runs into your Postgres</h1>
      <p>
        Each run's log lives in that run's actor database. A replica keeps a complete copy of every
        run in a Postgres database you own, so you can set retention, add indexes, run analytics,
        and rebuild a run without opening its actor.
      </p>

      <h2 id="attach">
        Attach a replica
        <a className="heading-anchor" href="#attach" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>postgresReplica</code> is registered like any other projector. Delivery reads events
        after blob offload, so the copy stores the payload the actor returned, not a pointer at
        object storage. The run summary, actors, and reviews are folded in the same transaction.
      </p>
      <CodeBlock lang="ts">{`import { postgresReplica } from '@swirls/looms/replica'

const replica = postgresReplica({
  url: process.env.DATABASE_URL!,
  migrate: 'auto',
})

// Pass \`replica\` in the host's projector list.
`}</CodeBlock>
      <p>
        <code>migrate: 'auto'</code> applies pending Looms migrations on startup, under an advisory
        lock. <code>migrate: 'verify'</code> refuses to start when a migration is missing and tells
        you to generate it. Use <code>verify</code> when your own migration tool owns the database.
      </p>

      <h2 id="migrate-or-generate">
        Migrate, or generate SQL
        <a className="heading-anchor" href="#migrate-or-generate" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Looms owns the <code>looms_*</code> tables. Generating SQL commits them to the folder your
        migration tool already applies. A second run writes nothing. <code>--check</code> exits
        non-zero while something is pending, which is what you want in CI.
      </p>
      <CodeBlock lang="bash">{`looms replica generate --out ./migrations --journal drizzle
looms replica generate --out ./migrations --journal drizzle --check
looms replica migrate --database "$DATABASE_URL"
looms replica status --database "$DATABASE_URL"
`}</CodeBlock>
      <p>
        Each file starts with <code>-- looms-migration: &lt;id&gt;</code>. The statements use{' '}
        <code>IF NOT EXISTS</code>, and Looms does not drop indexes you add yourself. Columns you
        add on <code>looms_run_index</code> are left alone.
      </p>

      <h2 id="query-with-drizzle">
        Query with Drizzle
        <a className="heading-anchor" href="#query-with-drizzle" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>drizzle-orm</code> is optional. Import the tables from{' '}
        <code>@swirls/looms/replica/drizzle</code>, and pass <code>runIndex</code> for columns your
        application owns. Those columns are not part of the Looms migration.
      </p>
      <CodeBlock lang="ts">{`import { jsonb, text, timestamp } from 'drizzle-orm/pg-core'
import { loomsReplicaTables } from '@swirls/looms/replica/drizzle'

export const { loomsRunIndex, loomsRunEvents } = loomsReplicaTables({
  runIndex: {
    input: jsonb('input'),
    error: text('error'),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
  },
})
`}</CodeBlock>

      <h2 id="freshness">
        What freshness means
        <a className="heading-anchor" href="#freshness" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>status(runId)</code> reports <code>replicatedSeq</code>, whether the run has finished,{' '}
        <code>complete</code>, and <code>purgedAt</code>. A run is complete when it has finished and
        every event through that finish has been copied. <code>eventStore().tail</code> returns the
        same sequence. If the delivery cursor is ahead of that copy, delivery rewinds once and reads
        the missing events before projecting. A batch that would still skip ahead is refused, so
        there is no silent gap. That covers a replica attached to a run already in flight, and a
        database restored from backup.
      </p>
      <CodeBlock lang="ts">{`const store = replica.eventStore()
const events = await store.read(runId)
const state = await replica.loadRun(runId, registry)
const freshness = await replica.status(runId)
`}</CodeBlock>
      <p>
        <code>loadRun</code> folds the copied events with the same registry the runtime used.
        Existing folds and replay run against <code>eventStore()</code> unchanged. The store is
        read-only.
      </p>

      <h2 id="retention">
        Retention
        <a className="heading-anchor" href="#retention" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>purge</code> deletes events for finished runs older than a cutoff and sets{' '}
        <code>purged_at</code>. The summary row stays unless you pass <code>keepIndex: false</code>.
        Later deliveries for a purged run are skipped, and <code>bounds</code> reports the log as
        empty. You can also delete rows yourself.
      </p>
      <CodeBlock lang="ts">{`await replica.purge({
  finishedBefore: Date.now() - 30 * 24 * 60 * 60 * 1000,
})
`}</CodeBlock>

      <h2 id="rebuilding-history">
        Rebuilding history
        <a className="heading-anchor" href="#rebuilding-history" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>rebuild(source)</code> copies each run from an event store into Postgres. Purged runs
        are left alone. A projector cursor that has moved past the copy is rewound once to{' '}
        <code>position(runId)</code>, which is <code>replicated_seq</code>. A purged run returns{' '}
        <code>null</code>, so delivery does not rewind it. Runs that finished before the replica was
        attached are not listed by an actor host; backfilling those needs a list of run ids from
        your application.
      </p>
      <p>
        Projections that are not a full copy still use the{' '}
        <Link to="/docs/projectors">projector</Link> path. The replica is the copy.
      </p>
    </>
  )
}
