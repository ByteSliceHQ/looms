import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { generateReplicaMigrations, POSTGRES_REPLICA_MIGRATIONS } from './migrations'

function journalEntries(text: string): readonly object[] {
  const value: unknown = JSON.parse(text)

  if (!Predicate.isObject(value) || !('entries' in value) || !Array.isArray(value.entries)) {
    throw new Error('expected a drizzle journal')
  }

  return value.entries.filter((entry) => Predicate.isObject(entry))
}

const directories: string[] = []

async function tempDir(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'looms-replica-'))
  directories.push(directory)
  return directory
}

describe('replica migration generate', () => {
  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
  })

  test('the migration list records its own id and only touches looms tables', () => {
    expect(POSTGRES_REPLICA_MIGRATIONS.map((migration) => migration.id)).toEqual(['0001_replica'])
    const sql = POSTGRES_REPLICA_MIGRATIONS[0]?.sql ?? ''
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS looms_run_events')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS replicated_seq')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS purged_at')
    expect(sql).toContain('looms_schema_migrations')

    expect(sql).toContain(
      "INSERT INTO looms_schema_migrations (id) VALUES ('0001_replica') ON CONFLICT (id) DO NOTHING;",
    )
  })

  test('check reports a pending migration and writes nothing', async () => {
    const out = await tempDir()
    const result = await generateReplicaMigrations({ out, check: true })

    expect(result.pending).toEqual(['0001_replica'])
    expect(result.written).toEqual([])
    expect(await readdir(out)).toEqual([])
  })

  test('continues the numeric prefix, then writes nothing the second time', async () => {
    const out = await tempDir()
    await writeFile(join(out, '0085_existing.sql'), 'SELECT 1;\n')
    await mkdir(join(out, 'meta'))

    await writeFile(
      join(out, 'meta', '_journal.json'),
      `${JSON.stringify({ version: '7', dialect: 'postgresql', entries: [] }, null, 2)}\n`,
    )

    const first = await generateReplicaMigrations({ out, journal: 'drizzle' })
    expect(first.written).toEqual(['0086_looms_0001_replica.sql'])

    const sql = await readFile(join(out, '0086_looms_0001_replica.sql'), 'utf8')
    expect(sql.startsWith('-- looms-migration: 0001_replica\n')).toBe(true)

    const journal = journalEntries(await readFile(join(out, 'meta', '_journal.json'), 'utf8'))

    expect(journal).toEqual([
      expect.objectContaining({ idx: 0, tag: '0086_looms_0001_replica' }),
    ])

    const second = await generateReplicaMigrations({ out, journal: 'drizzle' })
    expect(second).toEqual({ written: [], pending: [] })

    const checked = await generateReplicaMigrations({ out, check: true })
    expect(checked.pending).toEqual([])

    const reread = journalEntries(await readFile(join(out, 'meta', '_journal.json'), 'utf8'))
    expect(reread).toHaveLength(1)
  })
})
