import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import createPostgresClient, { type Sql } from 'postgres'

import { createEvent, type EventEnvelope, type EventInput, type RunStatus } from '@looms/core'

import { memoryEventLog, postgresEventLog, type RunLogRow } from './event-log'

const PORT = 54_329
const RUN_STATUSES: readonly RunStatus[] = ['running', 'completed', 'failed', 'cancelled']

/** Cold PGlite WASM load under a busy CI runner can exceed Bun's default hook timeout. */
const SETUP_TIMEOUT_MS = 60_000

let db: PGlite | undefined
let server: PGLiteSocketServer | undefined
let sql: Sql | undefined
const statements: string[] = []

function event(runId: string, seq: number, input: EventInput): EventEnvelope {
  return { ...createEvent(runId, input), seq, ts: 1_700_000_000_000 + seq * 1_000 }
}

function started(runId: string): EventEnvelope {
  return event(runId, 1, {
    type: 'runtime.run.started',
    payload: {
      rootThreadId: 'thr_1',
      kind: 'workflow',
      definitionName: 'checkout',
      definitionVersion: 'v1',
      input: { text: 'it\'s "quoted"' },
      attributes: { tenant: 'acme', project: 'billing' },
      launchedBy: {
        runId: 'run_parent',
        threadId: 'thr_parent',
        effectId: 'eff_1',
        causationId: 'evt_cause',
        causationSeq: 4,
      },
    },
    correlationId: 'run_root',
    threadId: null,
    origin: { type: 'system' },
  })
}

function step(runId: string, seq: number): EventEnvelope {
  return event(runId, seq, {
    type: 'workflow.node.completed',
    payload: 'plain string payload',
    threadId: 'thr_1',
    origin: { type: 'system' },
  })
}

function failed(runId: string, seq: number): EventEnvelope {
  return event(runId, seq, {
    type: 'runtime.run.completed',
    payload: { output: null, error: 'nope' },
    threadId: null,
    origin: { type: 'system' },
  })
}

interface IndexRow {
  readonly run_id: string
  readonly status: string
  readonly kind: string | null
  readonly definition_name: string | null
  readonly definition_version: string | null
  readonly root_thread_id: string | null
  readonly parent_run_id: string | null
  readonly launched_by_effect_id: string | null
  readonly correlation_id: string | null
  readonly attributes: { readonly [key: string]: string }
  readonly started_at: Date | null
  readonly updated_at: Date
  readonly completed_at: Date | null
}

function fromIndexRow(row: IndexRow): RunLogRow {
  return {
    runId: row.run_id,
    status: RUN_STATUSES.find((status) => status === row.status) ?? 'running',
    kind: row.kind,
    definitionName: row.definition_name,
    definitionVersion: row.definition_version,
    rootThreadId: row.root_thread_id,
    parentRunId: row.parent_run_id,
    launchedByEffectId: row.launched_by_effect_id,
    correlationId: row.correlation_id,
    attributes: row.attributes,
    startedAt: row.started_at?.getTime() ?? null,
    updatedAt: row.updated_at.getTime(),
    completedAt: row.completed_at?.getTime() ?? null,
  }
}

describe('postgres event log', () => {
  beforeAll(async () => {
    db = await PGlite.create()
    server = new PGLiteSocketServer({ db, port: PORT, host: '127.0.0.1' })
    await server.start()

    sql = createPostgresClient({
      host: '127.0.0.1',
      port: PORT,
      max: 1,
      onnotice: () => undefined,
      debug: (_connection, query) => {
        statements.push(query)
      },
    })
  }, SETUP_TIMEOUT_MS)

  afterAll(async () => {
    await sql?.end({ timeout: 1 })
    await server?.stop()
    await db?.close()
  }, SETUP_TIMEOUT_MS)

  function requireSql(): Sql {
    if (!sql) {
      throw new Error('postgres client was not started')
    }

    return sql
  }

  function indexRow(runId: string): Promise<RunLogRow | null> {
    return requireSql()<IndexRow[]>`SELECT * FROM looms_run_index WHERE run_id = ${runId}`.then(
      ([row]) => (row ? fromIndexRow(row) : null),
    )
  }

  test('matches the memory sink for starts, steps, a replay, and a finish', async () => {
    const client = requireSql()
    const postgres = postgresEventLog({ sql: client })
    const memory = memoryEventLog()
    await postgres.init?.()

    const batches = [
      [started('run_a'), step('run_a', 2), started('run_b')],
      [step('run_a', 3), failed('run_a', 4), step('run_b', 2)],
      [started('run_a'), step('run_a', 3)],
    ]

    for (const batch of batches) {
      await postgres.project(batch)
      await memory.project(batch)
    }

    for (const runId of ['run_a', 'run_b']) {
      expect(await indexRow(runId)).toEqual(memory.run(runId))
    }

    const events = await client<{ seq: string; payload: unknown }[]>`
      SELECT seq, payload FROM looms_run_events WHERE run_id = 'run_a' ORDER BY seq
    `

    expect(events.map((row) => Number(row.seq))).toEqual([1, 2, 3, 4])
    expect(events[1]?.payload).toBe('plain string payload')
    expect(events[0]?.payload).toMatchObject({ input: { text: 'it\'s "quoted"' } })
  })

  test('writes a batch with a fixed number of statements', async () => {
    const client = requireSql()
    const postgres = postgresEventLog({ sql: client })
    await postgres.init?.()

    const batch = Array.from({ length: 50 }, (_, index) => [
      started(`run_many_${index}`),
      step(`run_many_${index}`, 2),
      step(`run_many_${index}`, 3),
    ]).flat()

    statements.length = 0
    await postgres.project(batch)

    const writes = statements.filter((query) => /^\s*(INSERT|UPDATE)/i.test(query))

    const [count] = await client<{ count: string }[]>`
      SELECT count(*) FROM looms_run_index WHERE run_id LIKE 'run_many_%'
    `

    expect(writes).toHaveLength(2)
    expect(Number(count?.count)).toBe(50)
  })

  test('a touch-only batch updates existing runs and ignores unknown ones', async () => {
    const client = requireSql()
    const postgres = postgresEventLog({ sql: client })
    await postgres.init?.()
    await postgres.project([started('run_touch')])

    statements.length = 0
    await postgres.project([step('run_touch', 9), step('run_unknown', 2)])

    expect(statements.filter((query) => /^\s*UPDATE/i.test(query))).toHaveLength(1)
    expect((await indexRow('run_touch'))?.updatedAt).toBe(1_700_000_009_000)
    expect(await indexRow('run_unknown')).toBeNull()
  })

  test('copies declared attributes into their own indexed columns', async () => {
    const client = requireSql()

    const postgres = postgresEventLog({
      sql: client,
      additionalFields: { tenant: { index: true }, projectKey: { fieldName: 'project' } },
    })

    await postgres.init?.()
    await postgres.project([started('run_fields')])

    const [row] = await client<{ tenant: string | null; project: string | null }[]>`
      SELECT tenant, project FROM looms_run_index WHERE run_id = 'run_fields'
    `

    const indexes = await client<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'looms_run_index'
    `

    expect(row).toEqual({ tenant: 'acme', project: null })
    expect(indexes.map((index) => index.indexname)).toContain('looms_run_index_tenant')
    expect(indexes.map((index) => index.indexname)).not.toContain('looms_run_index_project')

    const applied = await client<{ id: string }[]>`
      SELECT id FROM looms_schema_migrations WHERE id LIKE 'column_%' OR id LIKE 'index_%'
      ORDER BY id
    `

    expect(applied.map((entry) => entry.id)).toEqual([
      'column_project',
      'column_tenant',
      'index_tenant',
    ])

    // A second init must not re-apply recorded attribute migrations.
    await postgres.init?.()

    const still = await client<{ id: string }[]>`
      SELECT id FROM looms_schema_migrations WHERE id LIKE 'column_%' OR id LIKE 'index_%'
      ORDER BY id
    `

    expect(still.map((entry) => entry.id)).toEqual([
      'column_project',
      'column_tenant',
      'index_tenant',
    ])
  })

  test('migrate auto is lock-free when migrations are already applied', async () => {
    const client = requireSql()
    const first = postgresEventLog({ sql: client, migrate: 'auto' })
    await first.init?.()

    statements.length = 0
    const second = postgresEventLog({ sql: client, migrate: 'auto' })
    await second.init?.()

    const ddl = statements.filter((query) =>
      /^\s*(CREATE|ALTER|INSERT\s+INTO\s+looms_schema_migrations)/i.test(query),
    )

    const locks = statements.filter((query) => /pg_advisory_xact_lock/i.test(query))

    expect(ddl).toEqual([])
    expect(locks).toEqual([])
  })

  test('migrate verify refuses a database that is missing migrations', async () => {
    const client = requireSql()
    await client`DROP TABLE IF EXISTS looms_schema_migrations CASCADE`

    const projector = postgresEventLog({ sql: client, migrate: 'verify' })
    let message = ''

    try {
      await projector.init?.()
    } catch (cause) {
      message = cause instanceof Error ? cause.message : String(cause)
    }

    expect(message).toMatch(/looms replica generate/)
    expect(message).toMatch(/0001_replica/)

    // Restore schema for later tests in this file.
    await postgresEventLog({ sql: client, migrate: 'auto' }).init?.()
  })

  test('migrate skip leaves schema ownership to the host', async () => {
    const client = requireSql()
    await client`DROP TABLE IF EXISTS looms_schema_migrations CASCADE`

    const projector = postgresEventLog({ sql: client, migrate: 'skip' })
    await projector.init?.()

    const tables = await client<{ name: string | null }[]>`
      SELECT to_regclass('public.looms_schema_migrations') AS name
    `

    expect(tables[0]?.name).toBeNull()

    await postgresEventLog({ sql: client, migrate: 'auto' }).init?.()
  })
})
