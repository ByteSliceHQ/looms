import { z } from 'zod'

import type { DailyFill, ReplicaView } from '@looms/meridian/http'
import { asJson } from '@swirls/looms/core'
import {
  d1ReplicaDatabase,
  sqliteReplica,
  type ReplicaStatus,
  type SqliteReplica,
} from '@swirls/looms/replica/sqlite'

export interface ReplicaEnv {
  readonly MERIDIAN_REPLICA?: D1Database
}

const FillPayload = z.object({
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  price: z.number(),
})

const FlagRow = z.object({ value: z.string() })

const FillRow = z.object({
  run_id: z.string(),
  ts: z.number(),
  payload: z.string(),
})

let cached: { readonly key: string; readonly replica: SqliteReplica } | undefined

/**
 * The event copy, when this isolate has D1.
 * `verify` refuses to project until the committed migrations have been applied.
 */
export function eventReplica(env: ReplicaEnv): SqliteReplica | undefined {
  const database = env.MERIDIAN_REPLICA

  if (!database) {
    return undefined
  }

  return remember(database, () =>
    sqliteReplica({
      database: d1ReplicaDatabase(database),
      migrate: 'verify',
    }),
  )
}

export function replicaView(env: ReplicaEnv, runId: string): Promise<ReplicaView> {
  const replica = eventReplica(env)

  if (!replica) {
    return Promise.resolve({ attached: false, copy: null })
  }

  return replica.status(runId).then(
    (status) => ({ attached: true, copy: status ? copyOf(status) : null }),
    () => ({ attached: true, copy: null }),
  )
}

export function readKilled(env: ReplicaEnv): Promise<boolean> {
  const database = env.MERIDIAN_REPLICA

  if (!database) {
    return Promise.resolve(false)
  }

  return database
    .prepare('SELECT value FROM meridian_flags WHERE name = ?')
    .bind('killed')
    .first()
    .then(
      (row) => {
        const parsed = FlagRow.safeParse(row)
        return parsed.success && parsed.data.value === '1'
      },
      () => false,
    )
}

export function writeKilled(env: ReplicaEnv, killed: boolean): Promise<void> {
  const database = env.MERIDIAN_REPLICA

  if (!database) {
    return Promise.reject(new Error('D1 is not attached'))
  }

  return database
    .prepare(
      `INSERT INTO meridian_flags (name, value) VALUES ('killed', ?)
       ON CONFLICT(name) DO UPDATE SET value = excluded.value`,
    )
    .bind(killed ? '1' : '0')
    .run()
    .then(() => undefined)
}

export function readFillsSince(env: ReplicaEnv, at: number): Promise<DailyFill[]> {
  const database = env.MERIDIAN_REPLICA

  if (!database) {
    return Promise.resolve([])
  }

  const day = 86_400_000
  const start = Math.floor(at / day) * day

  return database
    .prepare(
      `SELECT run_id, ts, payload FROM looms_run_events
       WHERE type IN ('execution.order.filled', 'execution.order.partially_filled')
         AND ts >= ? AND ts <= ?
       ORDER BY ts ASC`,
    )
    .bind(start, at)
    .all()
    .then(
      (result) => {
        const fills: DailyFill[] = []

        for (const row of result.results ?? []) {
          const parsed = FillRow.safeParse(row)

          if (!parsed.success) {
            continue
          }

          let payloadJson: ReturnType<typeof asJson>

          try {
            payloadJson = asJson(JSON.parse(parsed.data.payload))
          } catch {
            continue
          }

          const payload = FillPayload.safeParse(payloadJson)

          if (!payload.success) {
            continue
          }

          fills.push({
            runId: parsed.data.run_id,
            symbol: payload.data.symbol,
            side: payload.data.side,
            qty: payload.data.qty,
            price: payload.data.price,
            ts: parsed.data.ts,
          })
        }

        return fills
      },
      () => [],
    )
}

function remember(database: D1Database, create: () => SqliteReplica): SqliteReplica {
  const key = 'd1'

  if (cached?.key === key) {
    return cached.replica
  }

  const replica = create()
  cached = { key, replica }
  void database
  return replica
}

function copyOf(status: ReplicaStatus): ReplicaView['copy'] {
  return {
    replicatedSeq: status.replicatedSeq,
    finished: status.finished,
    complete: status.complete,
    purgedAt: status.purgedAt,
  }
}
