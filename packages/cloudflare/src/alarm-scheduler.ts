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
    schedule: async (_runId: string, at: number): Promise<void> => {
      await storage.setAlarm(at)
    },

    cancel: async (_runId: string): Promise<void> => {
      await storage.deleteAlarm()
    },
  }
}
