// PostgreSQL transactions are the Promise boundary; business orchestration uses Effect.
/* oxlint-disable effecttsgo/async-function */
import { Schema } from 'effect'
import postgres from 'postgres'

import type { JsonValue } from '@looms/core'

import { JobSchema, conflict, type Job, type JobStore } from './model'

const decode = Schema.decodeUnknownSync(JobSchema)
type Stored = { document: JsonValue }

export async function postgresJobStore(
  url: string,
): Promise<JobStore & { close(): Promise<void> }> {
  const sql = postgres(url, { max: 5, connect_timeout: 10 })

  try {
    await sql`CREATE TABLE IF NOT EXISTS looms_ax_jobs (
    id TEXT PRIMARY KEY,
    logical_key TEXT NOT NULL,
    document JSONB NOT NULL
  )`

    await sql`CREATE INDEX IF NOT EXISTS looms_ax_jobs_logical ON looms_ax_jobs(logical_key)`
    await sql`ALTER TABLE looms_ax_jobs ADD COLUMN IF NOT EXISTS polled_at TIMESTAMPTZ NOT NULL DEFAULT '-infinity'`

    await sql`CREATE INDEX IF NOT EXISTS looms_ax_jobs_pending ON looms_ax_jobs(polled_at, id)
    WHERE document->>'stopped' = 'false' OR document->>'delivery' IN ('pending', 'uncertain')`

    const leader = await sql.reserve()

    const [lock] = await leader<
      { acquired: boolean; pid: number }[]
    >`SELECT pg_try_advisory_lock(72413101) AS acquired, pg_backend_pid() AS pid`

    if (!lock?.acquired) {
      leader.release()
      throw new Error('AX bridge v1 requires one active reconciler per database')
    }

    const get = async (id: string): Promise<Job | null> => {
      const [row] = await sql<Stored[]>`SELECT document FROM looms_ax_jobs WHERE id = ${id}`
      return row ? decode(row.document) : null
    }

    return {
      get,
      accept: (job) =>
        sql.begin(async (tx) => {
          await tx`INSERT INTO looms_ax_jobs (id, logical_key, document)
        VALUES (${job.id}, ${job.logicalKey}, ${tx.json(job)}) ON CONFLICT DO NOTHING`

          const [row] = await tx<
            Stored[]
          >`SELECT document FROM looms_ax_jobs WHERE id = ${job.id} FOR UPDATE`

          if (!row) {
            throw new Error('Missing AX job after insertion')
          }

          const existing = decode(row.document)

          if (existing.requestHash !== job.requestHash) {
            conflict('Conflicting AX job submission')
          }

          if (job.cancelled && !existing.cancelled) {
            const cancelled = { ...existing, cancelled: true }
            await tx`UPDATE looms_ax_jobs SET document = ${tx.json(cancelled)} WHERE id = ${job.id}`
            return cancelled
          }

          return existing
        }),
      update: (id, change) =>
        sql.begin(async (tx) => {
          const [row] = await tx<
            Stored[]
          >`SELECT document FROM looms_ax_jobs WHERE id = ${id} FOR UPDATE`

          if (!row) {
            throw new Error('AX job not found')
          }

          const changed = change(decode(row.document))
          await tx`UPDATE looms_ax_jobs SET document = ${tx.json(changed)} WHERE id = ${id}`
          return changed
        }),
      pending: async () => {
        // Also verifies the dedicated leader session is still usable before each reconciliation pass.
        const [session] = await leader<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`

        if (session?.pid !== lock.pid) {
          throw new Error('AX bridge leader connection changed; restart to reacquire ownership')
        }

        // Rotate unresolved jobs through bounded batches so outages cannot starve newer work.
        const rows = await leader<(Stored & { pid: number })[]>`UPDATE looms_ax_jobs
        SET polled_at = clock_timestamp()
        WHERE id IN (
          SELECT id FROM looms_ax_jobs
          WHERE document->>'stopped' = 'false' OR document->>'delivery' IN ('pending', 'uncertain')
          ORDER BY polled_at, id LIMIT 200
        ) RETURNING document, pg_backend_pid() AS pid`

        if (rows.some((row) => row.pid !== lock.pid)) {
          throw new Error('AX bridge leader connection changed; restart to reacquire ownership')
        }

        return rows.map((row) => decode(row.document))
      },
      siblings: async (key) => {
        const rows = await sql<
          Stored[]
        >`SELECT document FROM looms_ax_jobs WHERE logical_key = ${key}`

        return rows.map((row) => decode(row.document))
      },
      close: async () => {
        try {
          await leader`SELECT pg_advisory_unlock(72413101)`
        } finally {
          leader.release()
          await sql.end({ timeout: 5 })
        }
      },
    }
  } catch (error) {
    await sql.end({ timeout: 5 })
    throw error
  }
}
