import { Context, Data, Effect } from 'effect'

import type { JsonValue, RunStatus } from './types'

/** Arguments for starting a run without waiting for it to finish. */
export interface LaunchRunArgs {
  readonly runId?: string
  readonly kind: string
  readonly definitionName: string
  readonly definitionVersion?: string
  readonly input?: JsonValue
  readonly threadId?: string
  readonly idempotencyKey?: string
}

/** Enough of a run to decide whether a previous fire is still in progress. */
export interface RunStatusSnapshot {
  readonly status: RunStatus
}

/**
 * Starts runs and reads their status from inside an effect. A single-store host launches into its
 * own runtime. An actor host launches into the cell that owns `runId`.
 */
export interface RunLauncher {
  readonly launch: (args: LaunchRunArgs) => Effect.Effect<void, Error>
  readonly status: (runId: string) => Effect.Effect<RunStatusSnapshot | null, Error>
}

export class RunLauncherTag extends Context.Service<RunLauncherTag, RunLauncher>()(
  'looms/RunLauncher',
) {}

export class RunLauncherError extends Data.TaggedError('RunLauncherError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

export function runLauncherError(cause: unknown): RunLauncherError {
  return new RunLauncherError({
    message: cause instanceof Error ? cause.message : String(cause),
    cause,
  })
}

export class RunLauncherUnavailableError extends Data.TaggedError('RunLauncherUnavailableError')<{
  readonly message: string
}> {
  constructor() {
    super({
      message:
        'No RunLauncher is configured. Pass launcher when hosting schedules in an actor cell or Durable Object.',
    })

    this.name = 'RunLauncherUnavailableError'
  }
}

/** Fails both operations. Actor cells and Durable Objects use this unless a launcher is configured. */
export const unavailableRunLauncher: RunLauncher = {
  launch: () => Effect.fail(new RunLauncherUnavailableError()),
  status: () => Effect.fail(new RunLauncherUnavailableError()),
}

/** Adapts a per-`runId` RPC or cell lookup into a `RunLauncher`. */
export function createRemoteRunLauncher(target: {
  readonly launch: (runId: string, args: LaunchRunArgs) => Promise<void>
  readonly status: (runId: string) => Promise<RunStatusSnapshot | null>
}): RunLauncher {
  return {
    launch: (args) => {
      const runId = args.runId

      if (!runId) {
        return Effect.fail(new RunLauncherError({ message: 'RunLauncher.launch requires runId' }))
      }

      return Effect.tryPromise({
        try: () => target.launch(runId, { ...args, runId }),
        catch: runLauncherError,
      })
    },
    status: (runId) =>
      Effect.tryPromise({
        try: () => target.status(runId),
        catch: runLauncherError,
      }),
  }
}
