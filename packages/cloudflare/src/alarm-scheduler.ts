import { Effect } from 'effect'

import type { WakeScheduler } from '@looms/runtime'

export interface AlarmStorage {
  setAlarm(scheduledTime: number | Date): Promise<void>
  deleteAlarm(): Promise<void>
}

/**
 * Adapter that maps actor wake timer scheduling to Cloudflare Durable Object alarms.
 */
export function alarmScheduler(storage: AlarmStorage): WakeScheduler {
  return {
    schedule: (_runId, at) => Effect.promise(() => storage.setAlarm(at)),
    cancel: () => Effect.promise(() => storage.deleteAlarm()),
  }
}
