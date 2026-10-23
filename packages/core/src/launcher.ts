import { Context, Data, Effect, Option, Schema } from 'effect'

import type { RunAttributes, SecretContext } from './run-context'
import type { JsonValue, RunStatus } from './types'

/** The effect that launched a run, recorded on the launched run's `runtime.run.started`. */
export const RunLaunchSourceSchema = Schema.Struct({
  runId: Schema.String,
  threadId: Schema.String,
  effectId: Schema.String,
  /** The event in `runId` that requested the launching effect. */
  causationId: Schema.String,
  causationSeq: Schema.Finite,
})

export type RunLaunchSource = Schema.Schema.Type<typeof RunLaunchSourceSchema>

const decodeRunLaunchSource = Schema.decodeUnknownOption(RunLaunchSourceSchema)

export function readRunLaunchSource(value: JsonValue | undefined): RunLaunchSource | null {
  return value === undefined ? null : Option.getOrNull(decodeRunLaunchSource(value))
}

/** Arguments for starting a run without waiting for it to finish. */
export interface LaunchRunArgs {
  readonly runId?: string
  readonly kind: string
  readonly definitionName: string
  readonly definitionVersion?: string
  readonly input?: JsonValue
  readonly threadId?: string
  readonly idempotencyKey?: string
  /** Set by the runtime when an effect launches. A value passed by the effect is replaced. */
  readonly launchedBy?: RunLaunchSource
  /**
   * Groups runs launched from the same root run. The runtime sets it to the launching run's
   * correlation id, or to the launching run's id when that run has none.
   */
  readonly correlationId?: string
  readonly attributes?: RunAttributes
  readonly secrets?: SecretContext
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
