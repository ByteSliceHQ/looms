import { Database } from 'bun:sqlite'

import type { RunAttributeFields } from '@looms/core'

import type { NoAdditionalFields } from './columns'
import {
  sqliteReplica,
  type SqlStatement,
  type SqlValue,
  type SqliteReplica,
  type SqliteReplicaDatabase,
  type SqliteReplicaMigrate,
} from './sqlite'

/** Opens a SQLite file. The replica closes it on `dispose`. */
export function openSqliteReplicaFile<const Fields extends RunAttributeFields = NoAdditionalFields>(
  filename: string,
  migrate: SqliteReplicaMigrate,
  additionalFields?: Fields,
): SqliteReplica<Fields> {
  const db = new Database(filename)

  const replica = sqliteReplica<Fields>({
    database: bunSqliteReplicaDatabase(db),
    migrate,
    additionalFields,
  })

  return {
    ...replica,
    dispose: () => {
      db.close()
      return Promise.resolve()
    },
  }
}

export function bunSqliteReplicaDatabase(db: Database): SqliteReplicaDatabase {
  return {
    exec: (sql) => {
      db.exec(sql)
      return Promise.resolve()
    },
    get: <T>(sql: string, params: readonly SqlValue[] = []) => {
      const row = db.query<T, SqlValue[]>(sql).get(...params)
      return Promise.resolve(row ?? null)
    },
    all: <T>(sql: string, params: readonly SqlValue[] = []) =>
      Promise.resolve(db.query<T, SqlValue[]>(sql).all(...params)),
    batch: (statements) => {
      if (statements.length === 0) {
        return Promise.resolve()
      }

      const apply = db.transaction((batch: readonly SqlStatement[]) => {
        for (const entry of batch) {
          db.run(entry.sql, [...entry.params])
        }
      })

      apply(statements)
      return Promise.resolve()
    },
  }
}
