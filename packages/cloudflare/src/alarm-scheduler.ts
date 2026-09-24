import { Effect } from 'effect'

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
  readonly scheduleAtEarliest: (at: number) => Promise<void>
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
  additionalDeadline?: () => Promise<number | null>,
): DurableObjectAlarms {
  // `undefined` until the runtime reports a deadline; until then an existing alarm is preserved.
  let runtimeDeadline: number | null | undefined
  let writes: Promise<void> = Promise.resolve()

  const rearm = (requested: number | null): Promise<void> => {
    const write = writes
      .catch(() => undefined)
      .then(() =>
        Promise.all([
          additionalDeadline?.() ?? Promise.resolve(null),
          storage.getAlarm?.() ?? Promise.resolve(null),
        ]),
      )
      .then(([additional, current]) => {
        const preserved = runtimeDeadline === undefined ? current : null
        const desired = earliest(runtimeDeadline, additional, requested, preserved)

        if (desired === current) {
          return undefined
        }

        return desired === null ? storage.deleteAlarm() : storage.setAlarm(desired)
      })

    writes = write
    return write
  }

  return {
    scheduler: {
      schedule: (_runId, at) =>
        Effect.promise(() => {
          runtimeDeadline = at
          return rearm(null)
        }),
      cancel: () =>
        Effect.promise(() => {
          runtimeDeadline = null
          return rearm(null)
        }),
    },
    scheduleAtEarliest: (at) => rearm(at),
  }
}
