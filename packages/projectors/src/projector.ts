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

export interface Projector {
  /** Used in error reporting / diagnostics. */
  readonly name: string
  /** Changes when projection semantics or its target schema changes. */
  readonly version: string
  /** Optional one-time setup (open connection, create tables). Runtime calls this before the first `project`. */
  readonly init?: () => Promise<void>
  /** Apply a batch of events in log order. Must be idempotent (a batch may be redelivered). */
  readonly project: (events: ReadonlyArray<EventEnvelope>) => Promise<void>
  readonly dispose?: () => Promise<void>
}

export type ProjectorErrorHandler = (
  error: Error,
  projector: Projector,
  events: ReadonlyArray<EventEnvelope>,
) => void
