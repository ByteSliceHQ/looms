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
      <h1>Replicate runs into a database you own</h1>
      <p>
        Each run's log lives in that run's actor database. A replica keeps a complete copy of every
        run in a Postgres or SQLite database you own, so you can set retention, add indexes, run
        analytics, and rebuild a run without opening its actor. SQLite includes Cloudflare D1.
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
        <code>migrate: 'auto'</code> applies pending Looms migrations on startup. Postgres takes an
        advisory lock while it does that. <code>migrate: 'verify'</code> refuses to start when a
        migration is missing and tells you to generate it. Use <code>verify</code> when your own
        migration tool owns the database.
      </p>
      <p>
        <code>sqliteReplica</code> is the same projector for a shared SQLite file or D1. It is not
        the actor's own SQLite. Pass a <code>D1Database</code> through{' '}
        <code>d1ReplicaDatabase</code>, or any driver that implements the replica's small async SQL
        surface. One writer per run is assumed: D1 applies the copy as a batch, not an interactive
        transaction.
      </p>
      <CodeBlock lang="ts">{`import { d1ReplicaDatabase, sqliteReplica } from '@swirls/looms/replica/sqlite'

const replica = sqliteReplica({
  database: d1ReplicaDatabase(env.REPLICA),
  migrate: 'verify',
})
`}</CodeBlock>
      <CodeBlock lang="bash">{`looms replica generate --dialect sqlite --out ./migrations
looms replica migrate --dialect sqlite --database ./replica.sqlite
looms replica status --dialect sqlite --database ./replica.sqlite
`}</CodeBlock>
      <p>
        On D1, apply the generated file with your own tool (<code>wrangler d1 execute</code>) and
        keep <code>migrate: 'verify'</code>. <code>--database</code> for the SQLite dialect is a
        file path. The default dialect is still Postgres.
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

      <h2 id="attribute-columns">
        Columns for your run attributes
        <a className="heading-anchor" href="#attribute-columns" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        Every run's attributes are stored as JSON on <code>looms_run_index</code>. Looms has no
        built-in attribute columns. Declare the attributes you filter, secure, or purge on with{' '}
        <code>defineRunAttributes</code>, and pass the same object to the host, the client, and the
        replica as <code>additionalFields</code>.
      </p>
      <CodeBlock lang="ts">{`// looms.attributes.ts
import { defineRunAttributes } from '@swirls/looms'

export const attributes = defineRunAttributes({
  tenantId: { required: true, index: true },
  project: { index: true },
  region: { fieldName: 'home_region' },
})
`}</CodeBlock>
      <CodeBlock lang="ts">{`const looms = createLooms({ modules, attributes })
await looms.start(billing, input, { attributes: { tenantId: 'acme' } })

const replica = postgresReplica({ url, migrate: 'auto', additionalFields: attributes })
`}</CodeBlock>
      <p>
        Each attribute becomes a text column named in snake_case (<code>tenantId</code> is{' '}
        <code>tenant_id</code>) unless you set <code>fieldName</code>. <code>index: true</code> adds{' '}
        <code>looms_run_index_tenant_id</code>. A <code>required</code> attribute must be on every
        start: leaving it out is a type error, and the host refuses it at runtime with{' '}
        <code>InvalidRunAttributesError</code> (400 on <code>POST /runs</code>). Undeclared keys are
        refused the same way. Launched runs and forks inherit their parent's attributes.
      </p>
      <p>
        Each column and each index is its own migration, such as <code>column_tenant_id</code> and{' '}
        <code>index_tenant_id</code>. Adding a column fills it in from the <code>attributes</code>{' '}
        JSON of runs already copied. Pass the module to the CLI with <code>--config</code> so the
        generated SQL matches; it reads an <code>attributes</code> or default export.
      </p>
      <CodeBlock lang="bash">{`looms replica generate --out ./migrations --config ./looms.attributes.ts
looms replica migrate --database "$DATABASE_URL" --config ./looms.attributes.ts
`}</CodeBlock>

      <h2 id="query-with-drizzle">
        Query with Drizzle
        <a className="heading-anchor" href="#query-with-drizzle" aria-label="Link to this section">
          #
        </a>
      </h2>
      <p>
        <code>drizzle-orm</code> is optional. Import the tables from{' '}
        <code>@swirls/looms/replica/drizzle</code>. <code>additionalFields</code> adds your
        attribute columns under their attribute keys, so <code>loomsRunIndex.tenantId</code> is the{' '}
        <code>tenant_id</code> column. Pass <code>runIndex</code> for columns your application owns.
        Those columns are not part of the Looms migration.
      </p>
      <CodeBlock lang="ts">{`import { jsonb, text, timestamp } from 'drizzle-orm/pg-core'
import { loomsReplicaTables } from '@swirls/looms/replica/drizzle'

import { attributes } from './looms.attributes'

export const { loomsRunIndex, loomsRunEvents } = loomsReplicaTables({
  additionalFields: attributes,
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
      <p>
        <code>where</code> limits a purge to runs whose attribute columns match. It accepts only
        declared attributes, so a typo is a type error rather than a purge of everything. Index the
        attributes you purge on.
      </p>
      <CodeBlock lang="ts">{`await replica.purge({
  finishedBefore: Date.now() - 7 * 24 * 60 * 60 * 1000,
  where: { tenantId: 'acme' },
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
