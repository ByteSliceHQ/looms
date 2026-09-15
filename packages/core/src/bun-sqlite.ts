import { Database } from 'bun:sqlite'

import { sqliteEventStore, type SqliteExec } from './sqlite-store'
import type { EventStore } from './store'

export interface BunSqliteEventStoreOptions {
  /** File path or `:memory:`. Default `:memory:`. */
  readonly path?: string
  readonly db?: Database
}

export function bunSqliteExec(db: Database): SqliteExec {
  return {
    run(sql, params = []) {
      db.run(sql, [...params])
    },
    rows(sql, params = []) {
      return db.query(sql).all(...params)
    },
  }
}

/**
 * Embedded EventStore backed by Bun's native SQLite engine (`bun:sqlite`).
 */
export function bunSqliteEventStore(options: BunSqliteEventStoreOptions = {}): EventStore {
  const db = options.db ?? new Database(options.path ?? ':memory:')
  return sqliteEventStore({ exec: bunSqliteExec(db) })
}
