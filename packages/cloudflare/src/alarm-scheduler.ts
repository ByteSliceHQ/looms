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
   * delivered by this alarm, so it is forgotten instead of being set again by a later rearm. So is
   * an alarm inherited from an earlier instance.
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
 * flight, `additionalDeadline` (such as projector retries), the requested time, and an alarm
 * inherited from an earlier instance, so concurrent writers cannot overwrite each other's
 * deadlines.
 *
 * The liveness deadline is what recovers a run whose isolate is lost mid-effect: the live wake
 * keeps pushing it forward, and once nothing does it fires in a fresh isolate, which wakes the run.
 *
 * An alarm already set when this instance starts was set by an earlier one, and may be the only
 * record of a wake that instance owed: one asked for now by `launch` or a scheduled signal, or its
 * liveness deadline. Run state does not hold those, so the deadline the runtime reads back from
 * state can be much later. The inherited alarm is kept until the runtime asks for a wake at or
 * before it, or an alarm fires.
 */
export function durableObjectAlarms(
  storage: AlarmStorage,
  additionalDeadline?: () => Effect.Effect<number | null>,
): DurableObjectAlarms {
  // `undefined` until the runtime reports a deadline.
  let runtimeDeadline: number | null | undefined
  let livenessDeadline: number | null = null
  // The alarm an earlier instance left set. `undefined` until the first write reads it.
  let inherited: number | null | undefined
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

        if (inherited === undefined) {
          inherited = current
        }

        // A wake the runtime asks for at or before the inherited alarm stands in for it.
        if (
          inherited !== null &&
          runtimeDeadline !== undefined &&
          runtimeDeadline !== null &&
          runtimeDeadline <= inherited
        ) {
          inherited = null
        }

        // Until the runtime reports, nothing here knows what the alarm is for, so it only moves
        // earlier.
        const preserved = runtimeDeadline === undefined ? current : null

        const desired = earliest(
          runtimeDeadline,
          livenessDeadline,
          additional,
          requested,
          inherited,
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
        // The wake that follows does whatever the inherited alarm was owed for.
        inherited = null

        if (runtimeDeadline !== undefined && runtimeDeadline !== null && runtimeDeadline <= now) {
          runtimeDeadline = null
        }
      }),
    ),
  }
}
