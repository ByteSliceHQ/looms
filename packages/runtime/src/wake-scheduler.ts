import { Effect } from 'effect'

export interface WakeScheduler {
  schedule(runId: string, at: number): void | Promise<void>
  cancel(runId: string): void | Promise<void>
  dispose?(): void
}

export function createTimeoutScheduler(
  wake: (runId: string) => Promise<void> | void,
): WakeScheduler {
  const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    schedule(runId: string, timerAt: number) {
      const existing = scheduledTimers.get(runId)

      if (existing) {
        clearTimeout(existing)
        scheduledTimers.delete(runId)
      }

      const delay = Math.max(0, timerAt - Date.now() + 5)

      const handle = setTimeout(() => {
        scheduledTimers.delete(runId)
        void wake(runId)
      }, delay)

      scheduledTimers.set(runId, handle)
    },

    cancel(runId: string) {
      const existing = scheduledTimers.get(runId)

      if (existing) {
        clearTimeout(existing)
        scheduledTimers.delete(runId)
      }
    },

    dispose() {
      for (const handle of scheduledTimers.values()) {
        clearTimeout(handle)
      }

      scheduledTimers.clear()
    },
  }
}

export function toEffectVoid(result: void | Promise<void>): Effect.Effect<void> {
  if (result instanceof Promise) {
    return Effect.promise(() => result)
  }

  return Effect.void
}
