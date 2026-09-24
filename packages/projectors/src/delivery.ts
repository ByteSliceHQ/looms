import { Data, Effect } from 'effect'

import type { EventStore } from '@looms/core'

import { runProjectorEffect, type Projector } from './projector'

export type ProjectorDeliveryState = 'idle' | 'retrying' | 'dead-letter'

export interface ProjectorDeliveryStatus {
  readonly runId: string
  readonly projector: string
  readonly version: string
  readonly cursor: number
  readonly state: ProjectorDeliveryState
  readonly attempts: number
  readonly failedSeq: number | null
  readonly nextRetryAt: number | null
  readonly lastError: string | null
  readonly updatedAt: number
}

export interface ProjectorCursorStore {
  get(runId: string, projector: Projector): Promise<ProjectorDeliveryStatus>
  advance(runId: string, projector: Projector, cursor: number, now: number): Promise<void>
  fail(
    runId: string,
    projector: Projector,
    failure: {
      readonly attempts: number
      readonly failedSeq: number
      readonly nextRetryAt: number | null
      readonly error: string
      readonly now: number
    },
  ): Promise<void>
  requeue(runId: string, projector: Projector, now: number): Promise<void>
  list(runId?: string): Promise<readonly ProjectorDeliveryStatus[]>
}

export interface ProjectorDeliveryOptions {
  readonly batchSize?: number
  readonly initialRetryMs?: number
  readonly maxRetryMs?: number
  readonly maxAttempts?: number
  readonly now?: () => number
  readonly scheduleRetry?: (at: number) => Promise<void>
  readonly observer?: ProjectorObserver
}

export type ProjectorObservation = {
  readonly type: 'projector.lag' | 'projector.retry' | 'projector.dead-letter'
  readonly runId: string
  readonly projector: string
  readonly at: number
  readonly cursor: number
  readonly lag: number
  readonly attempts: number
  readonly error?: string
}

export interface ProjectorObserver {
  observe(event: ProjectorObservation): void | Promise<void>
}

export interface ProjectorOperationalStatus extends ProjectorDeliveryStatus {
  readonly sourceTail: number
  readonly lag: number
}

export interface ProjectorDelivery {
  deliver(runId: string, options?: { readonly force?: boolean }): Promise<void>
  status(runId?: string): Promise<readonly ProjectorDeliveryStatus[]>
  requeue(runId: string, projectorName: string, version?: string): Promise<void>
  nextRetryAt(runId?: string): Promise<number | null>
  inspect(runId?: string): Promise<readonly ProjectorOperationalStatus[]>
  /** Re-register retry deadlines and resume due retryable projector work. */
  recover(runId?: string): Promise<number>
}

function projectorIdentity(projector: Projector): string {
  return `${projector.name}@${projector.version}`
}

class ProjectorDeliveryError extends Data.TaggedError('ProjectorDeliveryError')<{
  readonly message: string
}> {}

function normalizeError(cause: unknown): ProjectorDeliveryError {
  return new ProjectorDeliveryError({
    message: cause instanceof Error ? cause.message : String(cause),
  })
}

export function createProjectorDelivery(
  source: EventStore,
  projectors: readonly Projector[],
  cursors: ProjectorCursorStore,
  options: ProjectorDeliveryOptions = {},
): ProjectorDelivery {
  const batchSize = options.batchSize ?? 100
  const initialRetryMs = options.initialRetryMs ?? 1_000
  const maxRetryMs = options.maxRetryMs ?? 60_000
  const maxAttempts = options.maxAttempts ?? 8
  const now = options.now ?? Date.now
  const initialized = new Map<string, Promise<void>>()
  const inFlight = new Map<string, Promise<void>>()

  const observe = (event: ProjectorObservation): void => {
    try {
      Promise.resolve(options.observer?.observe(event)).catch(() => undefined)
    } catch {
      // Delivery correctness must not depend on telemetry.
    }
  }

  const initialize = (projector: Projector): Promise<void> => {
    const key = projectorIdentity(projector)
    let pending = initialized.get(key)

    if (!pending) {
      pending = projector.init?.() ?? Promise.resolve()
      initialized.set(key, pending)
    }

    return pending
  }

  const recordFailure = (
    runId: string,
    projector: Projector,
    status: ProjectorDeliveryStatus,
    failedSeq: number,
    error: ProjectorDeliveryError,
  ): Effect.Effect<void> =>
    Effect.gen(function* () {
      const attempts = status.attempts + 1
      const deadLettered = attempts >= maxAttempts

      const nextRetryAt = deadLettered
        ? null
        : now() + Math.min(maxRetryMs, initialRetryMs * 2 ** Math.max(0, attempts - 1))

      yield* Effect.promise(() =>
        cursors.fail(runId, projector, {
          attempts,
          failedSeq,
          nextRetryAt,
          error: error.message,
          now: now(),
        }),
      )

      const sourceTail = yield* source.tail(runId).pipe(Effect.orElseSucceed(() => status.cursor))

      observe({
        type: deadLettered ? 'projector.dead-letter' : 'projector.retry',
        runId,
        projector: projectorIdentity(projector),
        at: now(),
        cursor: status.cursor,
        lag: Math.max(0, sourceTail - status.cursor),
        attempts,
        error: error.message,
      })

      if (nextRetryAt !== null && options.scheduleRetry) {
        yield* Effect.promise(() => options.scheduleRetry!(nextRetryAt))
      }
    })

  const deliverProjector = (runId: string, projector: Projector, force: boolean): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        let status = yield* Effect.promise(() => cursors.get(runId, projector))
        const currentTime = now()

        if (
          status.state === 'dead-letter' ||
          (!force && status.nextRetryAt !== null && status.nextRetryAt > currentTime)
        ) {
          return
        }

        const initialization = yield* Effect.tryPromise({
          try: () => initialize(projector),
          catch: normalizeError,
        }).pipe(Effect.exit)

        if (initialization._tag === 'Failure') {
          yield* recordFailure(
            runId,
            projector,
            status,
            status.cursor + 1,
            normalizeError(initialization.cause),
          )

          return
        }

        while (true) {
          const events = yield* source.read(runId, {
            fromSeq: status.cursor + 1,
            limit: batchSize,
          })

          if (events.length === 0) {
            return
          }

          for (const event of events) {
            const projected = yield* runProjectorEffect(projectorIdentity(projector), () =>
              projector.project([event]),
            ).pipe(Effect.exit)

            if (projected._tag === 'Failure') {
              yield* recordFailure(
                runId,
                projector,
                status,
                event.seq,
                normalizeError(projected.cause),
              )

              return
            }

            yield* Effect.promise(() => cursors.advance(runId, projector, event.seq, now()))
            status = yield* Effect.promise(() => cursors.get(runId, projector))
            const sourceTail = yield* source.tail(runId).pipe(Effect.orElseSucceed(() => event.seq))

            observe({
              type: 'projector.lag',
              runId,
              projector: projectorIdentity(projector),
              at: now(),
              cursor: event.seq,
              lag: Math.max(0, sourceTail - event.seq),
              attempts: status.attempts,
            })
          }
        }
      }),
    )

  const deliverExclusive = (runId: string, projector: Projector, force: boolean): Promise<void> => {
    const key = `${runId}:${projectorIdentity(projector)}`
    const previous = inFlight.get(key) ?? Promise.resolve()

    const current = previous
      .catch(() => undefined)
      .then(() => deliverProjector(runId, projector, force))
      .finally(() => {
        if (inFlight.get(key) === current) {
          inFlight.delete(key)
        }
      })

    inFlight.set(key, current)
    return current
  }

  return {
    deliver: (runId, runOptions) =>
      Promise.all(
        projectors.map((projector) =>
          deliverExclusive(runId, projector, runOptions?.force ?? false),
        ),
      ).then(() => undefined),
    status: (runId) => cursors.list(runId),
    requeue: (runId, projectorName, version) => {
      const projector = projectors.find(
        (candidate) =>
          candidate.name === projectorName &&
          (version === undefined || candidate.version === version),
      )

      if (!projector) {
        throw new Error(
          `Unknown projector ${projectorName}${version === undefined ? '' : `@${version}`}`,
        )
      }

      return cursors
        .requeue(runId, projector, now())
        .then(() => deliverExclusive(runId, projector, true))
    },
    nextRetryAt: (runId) =>
      cursors.list(runId).then((statuses) => {
        const deadlines = statuses
          .map((status) => status.nextRetryAt)
          .filter((deadline): deadline is number => deadline !== null)

        return deadlines.length === 0 ? null : Math.min(...deadlines)
      }),
    inspect: (runId) =>
      cursors.list(runId).then((statuses) =>
        Promise.all(
          statuses.map((status) =>
            Effect.runPromise(source.tail(status.runId)).then((sourceTail) => ({
              ...status,
              sourceTail,
              lag: Math.max(0, sourceTail - status.cursor),
            })),
          ),
        ),
      ),
    recover: (runId) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const statuses = yield* Effect.promise(() => cursors.list(runId))
          let recovered = 0

          for (const status of statuses) {
            if (status.state === 'dead-letter' || status.nextRetryAt === null) {
              continue
            }

            if (options.scheduleRetry) {
              yield* Effect.promise(() => options.scheduleRetry!(status.nextRetryAt!))
            }

            if (status.nextRetryAt <= now()) {
              const projector = projectors.find(
                (candidate) =>
                  candidate.name === status.projector && candidate.version === status.version,
              )

              if (projector) {
                yield* Effect.promise(() => deliverExclusive(status.runId, projector, true))
              }
            }

            recovered += 1
          }

          return recovered
        }),
      ),
  }
}
