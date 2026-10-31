import { Database } from 'bun:sqlite'

import {
  sqliteReplica,
  type SqlStatement,
  type SqlValue,
  type SqliteReplica,
  type SqliteReplicaDatabase,
  type SqliteReplicaMigrate,
} from './sqlite'

/** Opens a SQLite file. The replica closes it on `dispose`. */
export function openSqliteReplicaFile(
  filename: string,
  migrate: SqliteReplicaMigrate,
): SqliteReplica {
  const db = new Database(filename)
  const replica = sqliteReplica({ database: bunSqliteReplicaDatabase(db), migrate })

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
