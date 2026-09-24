import { Effect } from 'effect'

import type { WakeScheduler } from '@looms/runtime'

export interface AlarmStorage {
  setAlarm(scheduledTime: number | Date): Promise<void>
  deleteAlarm(): Promise<void>
  getAlarm?(): Promise<number | null>
}

const scheduling = new WeakMap<object, Promise<void>>()

export function scheduleAlarmAtEarliest(storage: AlarmStorage, at: number): Promise<void> {
  const previous = scheduling.get(storage) ?? Promise.resolve()

  const current = previous
    .catch(() => undefined)
    .then(() => storage.getAlarm?.() ?? undefined)
    .then((scheduled) =>
      scheduled === undefined || scheduled === null || at < scheduled
        ? storage.setAlarm(at)
        : undefined,
    )
    .finally(() => {
      if (scheduling.get(storage) === current) {
        scheduling.delete(storage)
      }
    })

  scheduling.set(storage, current)
  return current
}

/**
 * Adapter that maps actor wake timer scheduling to Cloudflare Durable Object alarms.
 * `additionalDeadline` preserves non-runtime work (such as projector retries)
 * when the runtime schedules or cancels its own timer.
 */
export function alarmScheduler(
  storage: AlarmStorage,
  additionalDeadline?: () => Promise<number | null>,
): WakeScheduler {
  return {
    schedule: (_runId, at) =>
      Effect.promise(() =>
        (additionalDeadline?.() ?? Promise.resolve(null)).then((additional) =>
          storage.setAlarm(additional === null ? at : Math.min(at, additional)),
        ),
      ),
    cancel: () =>
      Effect.promise(() =>
        (additionalDeadline?.() ?? Promise.resolve(null)).then((additional) =>
          additional === null ? storage.deleteAlarm() : storage.setAlarm(additional),
        ),
      ),
  }
}
