import { Data, Effect } from 'effect'

import { isRunTerminal, type EventStore, type RunState } from '@looms/core'
import type { ProjectorDelivery } from '@looms/projectors'

export interface DeleteTerminalRunStorageOptions {
  /**
   * Projector identities (`name@version`) that must have delivered through the
   * log tail before storage is removed. Requires `delivery`.
   */
  readonly requireProjectors?: readonly string[]
  /** Delivery used to read projector cursors when `requireProjectors` is set. */
  readonly delivery?: ProjectorDelivery
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

function parseProjectorIdentity(
  runId: string,
  identity: string,
): Effect.Effect<ProjectorIdentity, ProjectorCoverageError> {
  const at = identity.indexOf('@')

  if (at <= 0 || at === identity.length - 1) {
    return Effect.fail(
      new ProjectorCoverageError({
        runId,
        message: `Invalid projector identity "${identity}"; expected name@version`,
      }),
    )
  }

  return Effect.succeed({ name: identity.slice(0, at), version: identity.slice(at + 1) })
}

function assertProjectorCoverage(
  store: EventStore,
  delivery: ProjectorDelivery,
  runId: string,
  requireProjectors: readonly string[],
): Effect.Effect<void, ProjectorCoverageError> {
  const boundsOf = store.bounds

  if (!boundsOf) {
    return Effect.fail(
      new ProjectorCoverageError({
        runId,
        message: 'Event store has no bounds(); cannot verify projector coverage',
      }),
    )
  }

  return Effect.gen(function* () {
    const bounds = yield* boundsOf(runId).pipe(
      Effect.mapError(
        (cause) =>
          new ProjectorCoverageError({
            runId,
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      ),
    )

    const statuses = yield* delivery.status(runId).pipe(
      Effect.mapError(
        (cause) =>
          new ProjectorCoverageError({
            runId,
            message: cause.message,
          }),
      ),
    )

    yield* Effect.forEach(
      requireProjectors,
      (identity) =>
        Effect.gen(function* () {
          const { name, version } = yield* parseProjectorIdentity(runId, identity)

          const row = statuses.find(
            (entry) => entry.projector === name && entry.version === version,
          )

          const cursor = row?.cursor ?? null

          if (cursor === null || cursor < bounds.tail) {
            return yield* new ProjectorCoverageError({
              runId,
              message: `Projector "${identity}" cursor ${cursor ?? 'missing'} is before log tail ${bounds.tail}`,
            })
          }

          return undefined
        }),
      { concurrency: 'unbounded' },
    )
  })
}

function wipeStorage(
  storage: TerminalRunStorageHost,
  runId: string,
  delivery: ProjectorDelivery | undefined,
): Effect.Effect<void> {
  const deleteAll = storage.deleteAll

  if (deleteAll) {
    return Effect.promise(() => deleteAll())
  }

  return Effect.sync(() => {
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
      try {
        void [...storage.sql.exec(`DELETE FROM ${table} WHERE run_id = ?`, runId)]
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)

        if (!/no such table/i.test(message)) {
          throw cause
        }
      }
    }
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
): Promise<void> {
  return Effect.runPromise(
    Effect.gen(function* () {
      if (!isRunTerminal(state)) {
        return yield* new RunNotTerminalError({ runId, status: state.status })
      }

      const required = options.requireProjectors ?? []

      if (required.length > 0) {
        const delivery = options.delivery

        if (!delivery) {
          return yield* new ProjectorCoverageError({
            runId,
            message: 'requireProjectors needs projector delivery on the event store',
          })
        }

        yield* assertProjectorCoverage(store, delivery, runId, required)
      }

      yield* wipeStorage(storage, runId, options.delivery)

      const deleteAlarm = storage.deleteAlarm

      if (deleteAlarm) {
        yield* Effect.promise(() => deleteAlarm())
      }

      return undefined
    }),
  )
}
