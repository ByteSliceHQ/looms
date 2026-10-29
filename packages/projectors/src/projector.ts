import { Data, Effect } from 'effect'

import type { EventEnvelope } from '@looms/core'

export class ProjectorError extends Data.TaggedError('ProjectorError')<{
  readonly projector: string
  readonly cause: unknown
  readonly message: string
}> {
  constructor(projector: string, cause: unknown) {
    super({
      projector,
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'ProjectorError'
  }
}

export function runProjectorEffect<A>(
  projector: string,
  operation: () => PromiseLike<A>,
): Effect.Effect<A, ProjectorError> {
  return Effect.tryPromise({
    try: () => Promise.resolve(operation()),
    catch: (cause) => new ProjectorError(projector, cause),
  })
}

export function runProjectorSync<A>(projector: string, operation: () => A): Promise<A> {
  return Effect.runPromise(
    Effect.try({
      try: operation,
      catch: (cause) => new ProjectorError(projector, cause),
    }),
  )
}

export function runProjectorPromise<A>(
  projector: string,
  operation: () => PromiseLike<A>,
): Promise<A> {
  return Effect.runPromise(runProjectorEffect(projector, operation))
}

/** A replica batch started after a hole. `project` refuses it and leaves the copy unchanged. */
export class ReplicaGapError extends Data.TaggedError('ReplicaGapError')<{
  readonly runId: string
  readonly replicatedSeq: number
  readonly batchFrom: number
}> {}

export interface Projector {
  /** Used in error reporting / diagnostics. */
  readonly name: string
  /** Changes when projection semantics or its target schema changes. */
  readonly version: string
  /** Optional one-time setup (open connection, create tables). Runtime calls this before the first `project`. */
  readonly init?: () => Promise<void>
  /**
   * How far this projector has applied `runId` with no hole in front of it.
   * When the number is behind the delivery cursor, delivery rewinds once and catches up.
   * `null` means the run is closed and delivery must not rewind it.
   */
  readonly position?: (runId: string) => Promise<number | null>
  /** Apply a batch of events in log order. Must be idempotent (a batch may be redelivered). */
  readonly project: (events: ReadonlyArray<EventEnvelope>) => Promise<void>
  readonly dispose?: () => Promise<void>
}

export type ProjectorErrorHandler = (
  error: Error,
  projector: Projector,
  events: ReadonlyArray<EventEnvelope>,
) => void
