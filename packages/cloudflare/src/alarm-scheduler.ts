import { Clock, Effect, Semaphore } from 'effect'

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
  /**
   * Run when the alarm fires, before waking. A runtime deadline that is already due is being
   * delivered by this alarm, so it is forgotten instead of being set again by a later rearm.
   */
  readonly fired: Effect.Effect<void>
}

function earliest(...deadlines: readonly (number | null | undefined)[]): number | null {
  const known = deadlines.filter(
    (deadline): deadline is number => deadline !== null && deadline !== undefined,
  )

  return known.length === 0 ? null : Math.min(...known)
}

/**
 * The single owner of a Durable Object's one alarm. Every write is serialized and sets the alarm to
 * the earliest of the runtime deadline, the liveness deadline of a wake with in-process effects in
 * flight, `additionalDeadline` (such as projector retries), and the requested time, so concurrent
 * writers cannot overwrite each other's deadlines.
 *
 * The liveness deadline is what recovers a run whose isolate is lost mid-effect: the live wake
 * keeps pushing it forward, and once nothing does it fires in a fresh isolate, which wakes the run.
 */
export function durableObjectAlarms(
  storage: AlarmStorage,
  additionalDeadline?: () => Effect.Effect<number | null>,
): DurableObjectAlarms {
  // `undefined` until the runtime reports a deadline; until then an existing alarm is preserved.
  let runtimeDeadline: number | null | undefined
  let livenessDeadline: number | null = null
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

        const desired = earliest(
          runtimeDeadline,
          livenessDeadline,
          additional,
          requested,
          preserved,
        )

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
      keepAlive: (_runId, until) =>
        Effect.suspend(() => {
          livenessDeadline = until
          return rearm(null)
        }),
    },
    scheduleAtEarliest: rearm,
    fired: Clock.currentTimeMillis.pipe(
      Effect.map((now) => {
        if (runtimeDeadline !== undefined && runtimeDeadline !== null && runtimeDeadline <= now) {
          runtimeDeadline = null
        }
      }),
    ),
  }
}
