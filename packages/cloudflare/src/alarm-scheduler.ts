import { Effect, Semaphore } from 'effect'

import type { WakeScheduler } from '@looms/runtime'

export interface AlarmStorage {
  setAlarm(scheduledTime: number | Date): Promise<void>
  deleteAlarm(): Promise<void>
  getAlarm?(): Promise<number | null>
}

export interface DurableObjectAlarms {
  /** Wake scheduler for the runtime; its deadline is remembered across rearms. */
  readonly scheduler: WakeScheduler
  /** Ensures the alarm fires no later than `at` without forgetting the runtime deadline. */
  readonly scheduleAtEarliest: (at: number) => Effect.Effect<void>
}

function earliest(...deadlines: readonly (number | null | undefined)[]): number | null {
  const known = deadlines.filter(
    (deadline): deadline is number => deadline !== null && deadline !== undefined,
  )

  return known.length === 0 ? null : Math.min(...known)
}

/**
 * The single owner of a Durable Object's one alarm. Every write is serialized and sets the alarm to
 * the earliest of the runtime deadline, `additionalDeadline` (such as projector retries), and the
 * requested time, so concurrent writers cannot overwrite each other's deadlines.
 */
export function durableObjectAlarms(
  storage: AlarmStorage,
  additionalDeadline?: () => Effect.Effect<number | null>,
): DurableObjectAlarms {
  // `undefined` until the runtime reports a deadline; until then an existing alarm is preserved.
  let runtimeDeadline: number | null | undefined
  const writes = Semaphore.makeUnsafe(1)

  const rearm = (requested: number | null): Effect.Effect<void> =>
    Semaphore.withPermits(
      writes,
      1,
      Effect.gen(function* () {
        const [additional, current] = yield* Effect.all(
          [
            additionalDeadline?.() ?? Effect.succeed(null),
            Effect.promise(() => storage.getAlarm?.() ?? Promise.resolve(null)),
          ],
          { concurrency: 'unbounded' },
        )

        const preserved = runtimeDeadline === undefined ? current : null
        const desired = earliest(runtimeDeadline, additional, requested, preserved)

        if (desired === current) {
          return
        }

        yield* Effect.promise(() =>
          desired === null ? storage.deleteAlarm() : storage.setAlarm(desired),
        )
      }),
    )

  return {
    scheduler: {
      schedule: (_runId, at) =>
        Effect.suspend(() => {
          runtimeDeadline = at
          return rearm(null)
        }),
      cancel: () =>
        Effect.suspend(() => {
          runtimeDeadline = null
          return rearm(null)
        }),
    },
    scheduleAtEarliest: rearm,
  }
}
