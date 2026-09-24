import { Effect, Layer } from 'effect'

import {
  EventStoreTag,
  snapshotStoreOf,
  withSnapshotStore,
  type EventStore,
  type EventEnvelope,
} from '@looms/core'

import type { ProjectorDelivery } from './delivery'
import { runProjectorEffect, type Projector, type ProjectorErrorHandler } from './projector'

export interface WithProjectorsOptions {
  onError?: ProjectorErrorHandler
  /** Durable cursor runner. When present, appends trigger catch-up from its persisted cursor. */
  delivery?: ProjectorDelivery
}

function defaultOnError(error: Error, projector: Projector): void {
  Effect.runFork(
    Effect.logWarning(`[@looms/projectors] ${projector.name} failed to project`, error),
  )
}

function logDeliveryFailure(runId: string, cause: unknown): Effect.Effect<void> {
  return Effect.logWarning(`[@looms/projectors] delivery for ${runId} failed`, cause)
}

/**
 * Wrap an EventStore so every successful append is also projected.
 * The primary log stays authoritative: once an append commits, projection can never turn it into
 * a failure. With a durable delivery runner, failures are persisted for retry; without one, they
 * are reported to `onError` and the projection is skipped.
 */
export function withProjectors(
  store: EventStore,
  projectors: ReadonlyArray<Projector>,
  options?: WithProjectorsOptions,
): EventStore {
  const onError = options?.onError ?? defaultOnError
  const delivery = options?.delivery

  const project = (runId: string, sequences: readonly number[]): Effect.Effect<void> => {
    if (delivery) {
      return runProjectorEffect('delivery', () => delivery.deliver(runId)).pipe(
        Effect.catch((cause) => logDeliveryFailure(runId, cause)),
      )
    }

    const fromSeq = sequences[0]

    if (fromSeq === undefined) {
      return Effect.void
    }

    return store.read(runId, { fromSeq, limit: sequences.length }).pipe(
      Effect.flatMap((written) =>
        Effect.forEach(
          projectors,
          (projector) =>
            runProjectorEffect(projector.name, () => projector.project(written)).pipe(
              Effect.catch((error) =>
                Effect.sync(() => {
                  onError(error, projector, written)
                }),
              ),
            ),
          { concurrency: 'unbounded', discard: true },
        ),
      ),
      Effect.catch((cause) => logDeliveryFailure(runId, cause)),
    )
  }

  const wrapped: EventStore = {
    append: (runId, events, appendOptions) =>
      store
        .append(runId, events, appendOptions)
        .pipe(
          Effect.tap((result) =>
            projectors.length === 0 ? Effect.void : project(runId, result.sequences),
          ),
        ),
    read: (runId, readOptions) => store.read(runId, readOptions),
    tail: (runId) => store.tail(runId),
    bounds: store.bounds ? (runId) => store.bounds!(runId) : undefined,
    trim: store.trim ? (runId, beforeSeq) => store.trim!(runId, beforeSeq) : undefined,
    subscribe: (runId, subscribeOptions) => store.subscribe(runId, subscribeOptions),
    listRuns: store.listRuns,
  }

  const snapshots = snapshotStoreOf(store)
  return snapshots ? withSnapshotStore(wrapped, snapshots) : wrapped
}

/** Project events after the fact (e.g. from a runtime hook). */
export function projectEvents(
  projectors: ReadonlyArray<Projector>,
  events: readonly EventEnvelope[],
): Promise<void> {
  return Effect.runPromise(
    Effect.forEach(
      projectors,
      (projector) => runProjectorEffect(projector.name, () => projector.project(events)),
      { concurrency: 'unbounded', discard: true },
    ),
  )
}

/**
 * Layer that decorates a base EventStore with projection.
 */
export function ProjectorsStoreLive(
  base: EventStore,
  projectors: ReadonlyArray<Projector>,
  options?: WithProjectorsOptions,
): Layer.Layer<EventStoreTag> {
  return Layer.succeed(EventStoreTag, withProjectors(base, projectors, options))
}
