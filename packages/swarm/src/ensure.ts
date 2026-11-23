import type { LaunchRunArgs, RunState } from '@looms/core'

import type { SwarmDefinition, SwarmStart } from './definitions'

/** The two operations `ensureSwarm` needs. `createLooms` already has them. */
export interface SwarmHost {
  startRun(args: LaunchRunArgs): Promise<{ readonly runId: string }>
  getRun(runId: string): Promise<RunState>
}

export type SwarmEnsureResult = 'started' | 'running'

/**
 * Start a swarm under a fixed run id unless that run already exists, so a host can call it on
 * every boot or whenever a tenant is provisioned. A swarm that was stopped, failed or cancelled
 * throws: its run id cannot be reused.
 */
export function ensureSwarm(
  host: SwarmHost,
  definition: SwarmDefinition,
  runId: string,
  config: NonNullable<SwarmStart> = {},
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
        })
        .then((): SwarmEnsureResult => 'started')
    }

    if (state.status !== 'running') {
      throw new Error(`Swarm "${runId}" is ${state.status}; start it again under a new run id`)
    }

    return 'running'
  })
}
