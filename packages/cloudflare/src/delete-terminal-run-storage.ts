import { Data, Effect } from 'effect'

import { isRunTerminal, type EventStore, type RunState } from '@looms/core'
import type { ProjectorDelivery } from '@looms/projectors'

export interface DeleteTerminalRunStorageOptions {
  /**
   * Projector identities (`name@version`) that must have delivered through the
   * log tail before storage is removed.
   */
  readonly requireProjectors?: readonly string[]
}

export class RunNotTerminalError extends Data.TaggedError('RunNotTerminalError')<{
  readonly runId: string
  readonly status: string
}> {}

export class ProjectorCoverageError extends Data.TaggedError('ProjectorCoverageError')<{
  readonly runId: string
  readonly message: string
}> {}

export interface TerminalRunStorageHost {
  readonly deleteAll?: () => Promise<void>
  readonly deleteAlarm?: () => Promise<void>
  readonly sql: {
    exec(query: string, ...bindings: readonly unknown[]): Iterable<unknown>
  }
}

interface ProjectorIdentity {
  readonly name: string
  readonly version: string
}

interface ProjectorCursorRow {
  readonly cursor: number
}

function parseProjectorIdentity(identity: string): ProjectorIdentity {
  const at = identity.indexOf('@')

  if (at <= 0 || at === identity.length - 1) {
    throw new ProjectorCoverageError({
      runId: '',
      message: `Invalid projector identity "${identity}"; expected name@version`,
    })
  }

  return { name: identity.slice(0, at), version: identity.slice(at + 1) }
}

function deliveryCursor(
  storage: TerminalRunStorageHost,
  delivery: ProjectorDelivery | undefined,
  runId: string,
  name: string,
  version: string,
): Promise<number | null> {
  if (delivery) {
    return Effect.runPromise(delivery.status(runId)).then((rows) => {
      const row = rows.find((entry) => entry.projector === name && entry.version === version)

      return row?.cursor ?? null
    })
  }

  // SAFETY: SqlStorage.exec yields untyped row objects; we only read the cursor column
  // selected by the query above.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const [row] = [
    ...storage.sql.exec(
      `SELECT cursor FROM looms_projector_delivery
       WHERE run_id = ? AND projector_name = ? AND projector_version = ?`,
      runId,
      name,
      version,
    ),
  ] as ProjectorCursorRow[]

  return Promise.resolve(row?.cursor ?? null)
}

function projectorTailCovered(
  storage: TerminalRunStorageHost,
  store: EventStore,
  delivery: ProjectorDelivery | undefined,
  runId: string,
  requireProjectors: readonly string[],
): Promise<void> {
  if (requireProjectors.length === 0) {
    return Promise.resolve()
  }

  if (!store.bounds) {
    return Promise.reject(
      new ProjectorCoverageError({
        runId,
        message: 'Event store has no bounds(); cannot verify projector coverage',
      }),
    )
  }

  return Effect.runPromise(store.bounds(runId)).then((bounds) => {
    const tail = bounds.tail

    return requireProjectors.reduce<Promise<void>>(
      (prior, identity) =>
        prior.then(() => {
          const { name, version } = parseProjectorIdentity(identity)

          return deliveryCursor(storage, delivery, runId, name, version).then((cursor) => {
            if (cursor === null || cursor < tail) {
              throw new ProjectorCoverageError({
                runId,
                message: `Projector "${identity}" cursor ${cursor ?? 'missing'} is before log tail ${tail}`,
              })
            }
          })
        }),
      Promise.resolve(),
    )
  })
}

/**
 * Deletes this Durable Object's embedded SQLite once the run is terminal and
 * optional projector checkpoints cover the log tail. One run owns the object, so
 * {@link TerminalRunStorageHost.deleteAll} removes the actor copy.
 */
export function deleteTerminalRunStorage(
  storage: TerminalRunStorageHost,
  store: EventStore,
  runId: string,
  state: RunState,
  options: DeleteTerminalRunStorageOptions = {},
  delivery?: ProjectorDelivery,
): Promise<void> {
  if (!isRunTerminal(state)) {
    return Promise.reject(new RunNotTerminalError({ runId, status: state.status }))
  }

  const required = options.requireProjectors ?? []

  const covered =
    required.length > 0
      ? projectorTailCovered(storage, store, delivery, runId, required)
      : Promise.resolve()

  return covered
    .then(() => {
      if (storage.deleteAll) {
        return storage.deleteAll()
      }

      const tables = [
        'looms_events',
        'looms_snapshots',
        'looms_commands',
        'looms_run_secrets',
        'looms_run_headers',
        'looms_streams',
      ]

      if (delivery) {
        tables.unshift('looms_projector_delivery')
      }

      for (const table of tables) {
        void [...storage.sql.exec(`DELETE FROM ${table} WHERE run_id = ?`, runId)]
      }

      return undefined
    })
    .then(() => storage.deleteAlarm?.())
}
