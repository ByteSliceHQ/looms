import type { EventEnvelope } from '@looms/core'

export interface Projector {
  /** Used in error reporting / diagnostics. */
  readonly name: string
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
