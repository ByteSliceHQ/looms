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

function parseProjectorIdentity(identity: string): {
  readonly name: string
  readonly version: string
} {
  const at = identity.indexOf('@')

  if (at <= 0 || at === identity.length - 1) {
    throw new ProjectorCoverageError({
      runId: '',
      message: `Invalid projector identity "${identity}"; expected name@version`,
    })
  }

  return { name: identity.slice(0, at), version: identity.slice(at + 1) }
}

async function deliveryCursor(
  storage: TerminalRunStorageHost,
  delivery: ProjectorDelivery | undefined,
  runId: string,
  name: string,
  version: string,
): Promise<number | null> {
  if (delivery) {
    const rows = await Effect.runPromise(delivery.status(runId))
    const row = rows.find((entry) => entry.projector === name && entry.version === version)

    return row?.cursor ?? null
  }

  const [row] = [
    ...storage.sql.exec(
      `SELECT cursor FROM looms_projector_delivery
       WHERE run_id = ? AND projector_name = ? AND projector_version = ?`,
      runId,
      name,
      version,
    ),
  ] as { cursor: number }[]

  return row?.cursor ?? null
}

async function projectorTailCovered(
  storage: TerminalRunStorageHost,
  store: EventStore,
  delivery: ProjectorDelivery | undefined,
  runId: string,
  requireProjectors: readonly string[],
): Promise<void> {
  if (requireProjectors.length === 0) {
    return
  }

  if (!store.bounds) {
    throw new ProjectorCoverageError({
      runId,
      message: 'Event store has no bounds(); cannot verify projector coverage',
    })
  }

  const bounds = await Effect.runPromise(store.bounds(runId))
  const tail = bounds.tail

  for (const identity of requireProjectors) {
    const { name, version } = parseProjectorIdentity(identity)
    const cursor = await deliveryCursor(storage, delivery, runId, name, version)

    if (cursor === null || cursor < tail) {
      throw new ProjectorCoverageError({
        runId,
        message: `Projector "${identity}" cursor ${cursor ?? 'missing'} is before log tail ${tail}`,
      })
    }
  }
}

/**
 * Deletes this Durable Object's embedded SQLite once the run is terminal and
 * optional projector checkpoints cover the log tail. One run owns the object, so
 * {@link TerminalRunStorageHost.deleteAll} removes the actor copy.
 */
export async function deleteTerminalRunStorage(
  storage: TerminalRunStorageHost,
  store: EventStore,
  runId: string,
  state: RunState,
  options: DeleteTerminalRunStorageOptions = {},
  delivery?: ProjectorDelivery,
): Promise<void> {
  if (!isRunTerminal(state)) {
    throw new RunNotTerminalError({ runId, status: state.status })
  }

  const required = options.requireProjectors ?? []

  if (required.length > 0) {
    await projectorTailCovered(storage, store, delivery, runId, required)
  }

  if (storage.deleteAll) {
    await storage.deleteAll()
  } else {
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
  }

  await storage.deleteAlarm?.()
}
