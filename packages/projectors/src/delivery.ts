import { Data, Effect, Semaphore } from 'effect'

import type { EventStore, EventStoreError } from '@looms/core'

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

export class ProjectorCursorError extends Data.TaggedError('ProjectorCursorError')<{
  readonly message: string
}> {}

export interface ProjectorCursorStore {
  get(
    runId: string,
    projector: Projector,
  ): Effect.Effect<ProjectorDeliveryStatus, ProjectorCursorError>
  advance(
    runId: string,
    projector: Projector,
    cursor: number,
    now: number,
  ): Effect.Effect<void, ProjectorCursorError>
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
  ): Effect.Effect<void, ProjectorCursorError>
  requeue(
    runId: string,
    projector: Projector,
    now: number,
  ): Effect.Effect<void, ProjectorCursorError>
  list(runId?: string): Effect.Effect<readonly ProjectorDeliveryStatus[], ProjectorCursorError>
}

export class UnknownProjectorError extends Data.TaggedError('UnknownProjectorError')<{
  readonly message: string
}> {}

export type ProjectorDeliveryFailure = ProjectorCursorError | EventStoreError

export interface ProjectorDeliveryOptions {
  readonly batchSize?: number
  readonly initialRetryMs?: number
  readonly maxRetryMs?: number
  readonly maxAttempts?: number
  readonly now?: () => number
  readonly scheduleRetry?: (at: number) => Effect.Effect<void>
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
  deliver(
    runId: string,
    options?: { readonly force?: boolean },
  ): Effect.Effect<void, ProjectorDeliveryFailure>
  status(runId?: string): Effect.Effect<readonly ProjectorDeliveryStatus[], ProjectorCursorError>
  requeue(
    runId: string,
    projectorName: string,
    version?: string,
  ): Effect.Effect<void, ProjectorDeliveryFailure | UnknownProjectorError>
  nextRetryAt(runId?: string): Effect.Effect<number | null, ProjectorCursorError>
  inspect(
    runId?: string,
  ): Effect.Effect<readonly ProjectorOperationalStatus[], ProjectorDeliveryFailure>
  /** Re-register retry deadlines and resume due retryable projector work. */
  recover(runId?: string): Effect.Effect<number, ProjectorDeliveryFailure>
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
  const exclusive = new Map<string, Semaphore.Semaphore>()

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
      pending = Promise.resolve(projector.init?.()).catch((cause: unknown) => {
        initialized.delete(key)
        throw cause
      })

      initialized.set(key, pending)
    }

    return pending
  }

  const scheduleRetry = (at: number): Effect.Effect<void> =>
    options.scheduleRetry?.(at) ?? Effect.void

  const recordFailure = (
    runId: string,
    projector: Projector,
    status: ProjectorDeliveryStatus,
    failedSeq: number,
    error: ProjectorDeliveryError,
  ): Effect.Effect<void, ProjectorCursorError> =>
    Effect.gen(function* () {
      const attempts = status.attempts + 1
      const deadLettered = attempts >= maxAttempts

      const nextRetryAt = deadLettered
        ? null
        : now() + Math.min(maxRetryMs, initialRetryMs * 2 ** Math.max(0, attempts - 1))

      yield* cursors.fail(runId, projector, {
        attempts,
        failedSeq,
        nextRetryAt,
        error: error.message,
        now: now(),
      })

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

      if (nextRetryAt !== null) {
        yield* scheduleRetry(nextRetryAt)
      }
    })

  const deliverProjector = (
    runId: string,
    projector: Projector,
    force: boolean,
  ): Effect.Effect<void, ProjectorDeliveryFailure> =>
    Effect.gen(function* () {
      let status = yield* cursors.get(runId, projector)
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

        const first = events[0]
        const last = events.at(-1)

        if (first === undefined || last === undefined) {
          return
        }

        const projected = yield* runProjectorEffect(projectorIdentity(projector), () =>
          projector.project(events),
        ).pipe(Effect.exit)

        if (projected._tag === 'Failure') {
          yield* recordFailure(runId, projector, status, first.seq, normalizeError(projected.cause))
          return
        }

        const advancedAt = now()
        yield* cursors.advance(runId, projector, last.seq, advancedAt)

        status = {
          ...status,
          cursor: last.seq,
          state: 'idle',
          attempts: 0,
          failedSeq: null,
          nextRetryAt: null,
          lastError: null,
        }

        const sourceTail = yield* source.tail(runId).pipe(Effect.orElseSucceed(() => last.seq))

        observe({
          type: 'projector.lag',
          runId,
          projector: projectorIdentity(projector),
          at: advancedAt,
          cursor: last.seq,
          lag: Math.max(0, sourceTail - last.seq),
          attempts: 0,
        })
      }
    })

  /** One delivery at a time per run and projector; independent projectors still run in parallel. */
  const deliverExclusive = (
    runId: string,
    projector: Projector,
    force: boolean,
  ): Effect.Effect<void, ProjectorDeliveryFailure> => {
    const key = `${runId}:${projectorIdentity(projector)}`
    let semaphore = exclusive.get(key)

    if (!semaphore) {
      semaphore = Semaphore.makeUnsafe(1)
      exclusive.set(key, semaphore)
    }

    return Semaphore.withPermits(semaphore, 1, deliverProjector(runId, projector, force))
  }

  const findProjector = (name: string, version: string | undefined) =>
    projectors.find(
      (candidate) =>
        candidate.name === name && (version === undefined || candidate.version === version),
    )

  return {
    deliver: (runId, runOptions) =>
      Effect.forEach(
        projectors,
        (projector) => deliverExclusive(runId, projector, runOptions?.force ?? false),
        { concurrency: 'unbounded', discard: true },
      ),
    status: (runId) => cursors.list(runId),
    requeue: (runId, projectorName, version) => {
      const projector = findProjector(projectorName, version)

      if (!projector) {
        return Effect.fail(
          new UnknownProjectorError({
            message: `Unknown projector ${projectorName}${version === undefined ? '' : `@${version}`}`,
          }),
        )
      }

      return cursors
        .requeue(runId, projector, now())
        .pipe(Effect.andThen(deliverExclusive(runId, projector, true)))
    },
    nextRetryAt: (runId) =>
      cursors.list(runId).pipe(
        Effect.map((statuses) => {
          const deadlines = statuses
            .map((status) => status.nextRetryAt)
            .filter((deadline): deadline is number => deadline !== null)

          return deadlines.length === 0 ? null : Math.min(...deadlines)
        }),
      ),
    inspect: (runId) =>
      cursors.list(runId).pipe(
        Effect.flatMap((statuses) =>
          Effect.forEach(
            statuses,
            (status) =>
              source.tail(status.runId).pipe(
                Effect.map((sourceTail) => ({
                  ...status,
                  sourceTail,
                  lag: Math.max(0, sourceTail - status.cursor),
                })),
              ),
            { concurrency: 'unbounded' },
          ),
        ),
      ),
    recover: (runId) =>
      Effect.gen(function* () {
        const statuses = yield* cursors.list(runId)
        let recovered = 0

        for (const status of statuses) {
          if (status.state === 'dead-letter' || status.nextRetryAt === null) {
            continue
          }

          yield* scheduleRetry(status.nextRetryAt)

          if (status.nextRetryAt <= now()) {
            const projector = findProjector(status.projector, status.version)

            if (projector) {
              yield* deliverExclusive(status.runId, projector, true)
            }
          }

          recovered += 1
        }

        return recovered
      }),
  }
}
