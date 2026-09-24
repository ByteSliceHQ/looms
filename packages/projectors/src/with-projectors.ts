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

/**
 * Wrap an EventStore so every successful append is also projected.
 * The primary log stays authoritative. With a durable delivery runner, failures
 * are persisted for retry; without one, projection errors are surfaced to the caller.
 */
export function withProjectors(
  store: EventStore,
  projectors: ReadonlyArray<Projector>,
  options?: WithProjectorsOptions,
): EventStore {
  const onError = options?.onError ?? defaultOnError

  const wrapped: EventStore = {
    append: (runId, events, appendOptions) =>
      Effect.gen(function* () {
        const result = yield* store.append(runId, events, appendOptions)
        const fromSeq = result.sequences[0]

        if (projectors.length > 0 && options?.delivery) {
          yield* Effect.promise(() => options.delivery!.deliver(runId))
          return result
        }

        if (fromSeq !== undefined && projectors.length > 0) {
          const written = yield* store.read(runId, {
            fromSeq,
            limit: result.sequences.length,
          })

          yield* Effect.forEach(
            projectors,
            (projector) =>
              runProjectorEffect(projector.name, () => projector.project(written)).pipe(
                Effect.tapError((error) =>
                  Effect.sync(() => {
                    onError(error, projector, written)
                  }),
                ),
                Effect.orDie,
              ),
            { concurrency: 'unbounded', discard: true },
          )
        }

        return result
      }),
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
