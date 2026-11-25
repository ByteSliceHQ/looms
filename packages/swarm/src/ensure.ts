import type {
  EventInput,
  LaunchRunArgs,
  ProjectionDefinition,
  RunAttributes,
  RunState,
} from '@looms/core'

import type { SwarmDefinition, SwarmStart } from './definitions'
import { swarmStatus, type SwarmStatus } from './projections'
import { restart } from './signals'

/** What `ensureSwarm` needs from a host. `createLooms` already has all of it. */
export interface SwarmHost {
  startRun(args: LaunchRunArgs): Promise<{ readonly runId: string }>
  getRun(runId: string): Promise<RunState>
  signal(
    runId: string,
    events: ReadonlyArray<EventInput>,
    options?: { readonly idempotencyKey?: string },
  ): Promise<RunState>
  project<S>(runId: string, definition: ProjectionDefinition<S>): Promise<S>
}

/**
 * - `started`: there was no run, so the swarm was started.
 * - `running`: the swarm was already running.
 * - `paused`: the swarm is paused and was left so. Signal `resume()` to carry on.
 * - `restarted`: the swarm was stopped or halted, and a new generation was started.
 * - `stopped` and `halted`: as found, because `restart` was `false`.
 */
export type SwarmEnsureResult =
  | 'started'
  | 'running'
  | 'paused'
  | 'restarted'
  | 'stopped'
  | 'halted'

export interface SwarmRestartOptions {
  /**
   * Where the new generation starts reading: a board cursor, or null for the start of the log.
   * Omit to carry on from the swarm's cursor, or from the start when the board changes.
   */
  readonly after?: string | null
}

export interface SwarmEnsureOptions {
  /**
   * The labels the swarm's run starts with, such as its tenant. Every member run inherits them,
   * so the board resolver, the members' tools and the model adapter all see the same tenant.
   */
  readonly attributes?: RunAttributes
  /**
   * How to restart a swarm that was stopped or halted. Default `{}`: restart it on the board in
   * `config` (or its current board) from its cursor. `false` leaves it as it is.
   */
  readonly restart?: SwarmRestartOptions | false
}

/** Start the next generation of a stopped or halted swarm, unless the host said not to. */
function restartStopped(
  host: SwarmHost,
  runId: string,
  status: SwarmStatus,
  config: NonNullable<SwarmStart>,
  options: SwarmEnsureOptions,
): Promise<SwarmEnsureResult> {
  if (options.restart === false) {
    return Promise.resolve(status.status === 'halted' ? 'halted' : 'stopped')
  }

  const signal = restart({ board: config.board, after: options.restart?.after })

  // Two hosts that ensure the same stopped swarm at once start one generation, not two.
  const idempotencyKey = `swarm-restart:${status.generation}`

  return host.signal(runId, [signal], { idempotencyKey }).then((): SwarmEnsureResult => 'restarted')
}

/**
 * Make sure a swarm is running under a fixed run id, so a host can call it on every boot or
 * whenever a tenant is provisioned. Starts the swarm when the run does not exist, and starts a
 * new generation of a swarm that was stopped or halted. A paused swarm stays paused.
 *
 * A run that ended (cancelled, or failed outside the swarm) throws: its run id cannot be reused.
 */
export function ensureSwarm(
  host: SwarmHost,
  definition: SwarmDefinition,
  runId: string,
  config: NonNullable<SwarmStart> = {},
  options: SwarmEnsureOptions = {},
): Promise<SwarmEnsureResult> {
  return host.getRun(runId).then((state) => {
    if (state.rootThreadId === null) {
      return host
        .startRun({
          runId,
          kind: definition.kind,
          definitionName: definition.name,
          definitionVersion: definition.version,
          input: config,
          attributes: options.attributes,
        })
        .then((): SwarmEnsureResult => 'started')
    }

    if (state.status !== 'running') {
      throw new Error(`Swarm "${runId}" is ${state.status}; start it again under a new run id`)
    }

    return host.project(runId, swarmStatus).then((status): Promise<SwarmEnsureResult> => {
      switch (status.status) {
        case 'running':
        case 'paused':
          return Promise.resolve(status.status)

        case 'stopping':
        case 'stopped':
        case 'halted':
          return restartStopped(host, runId, status, config, options)

        default:
          // The projection saw the run end after getRun read it.
          throw new Error(`Swarm "${runId}" is ${status.status}; start it again under a new run id`)
      }
    })
  })
}
