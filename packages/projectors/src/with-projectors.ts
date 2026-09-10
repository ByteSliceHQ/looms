import { Effect, Layer } from 'effect'

import { EventStoreTag, type EventStore, type EventEnvelope } from '@looms/core'

import type { Projector, ProjectorErrorHandler } from './projector'

export interface WithProjectorsOptions {
  onError?: ProjectorErrorHandler
}

function defaultOnError(error: Error, projector: Projector): void {
  console.warn(`[@looms/projectors] ${projector.name} failed to project: ${error.message}`)
}

/**
 * Wrap an EventStore so every successful append is also projected.
 * Projection failures are isolated so the primary log stays authoritative.
 */
export function withProjectors(
  store: EventStore,
  projectors: ReadonlyArray<Projector>,
  options?: WithProjectorsOptions,
): EventStore {
  const onError = options?.onError ?? defaultOnError

  return {
    append: (runId, events, appendOptions) =>
      Effect.gen(function* () {
        const result = yield* store.append(runId, events, appendOptions)
        const fromSeq = result.sequences[0]

        if (fromSeq !== undefined && projectors.length > 0) {
          const written = yield* store.read(runId, {
            fromSeq,
            limit: result.sequences.length,
          })

          yield* Effect.promise(async () => {
            for (const projector of projectors) {
              try {
                await projector.project(written)
              } catch (cause) {
                onError(
                  cause instanceof Error ? cause : new Error(String(cause)),
                  projector,
                  written,
                )
              }
            }
          })
        }

        return result
      }),
    read: (runId, readOptions) => store.read(runId, readOptions),
    tail: (runId) => store.tail(runId),
    subscribe: (runId, subscribeOptions) => store.subscribe(runId, subscribeOptions),
    listRuns: () => store.listRuns(),
  }
}

/** Project events after the fact (e.g. from a runtime hook). */
export async function projectEvents(
  projectors: ReadonlyArray<Projector>,
  events: readonly EventEnvelope[],
): Promise<void> {
  for (const projector of projectors) {
    await projector.project(events)
  }
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
