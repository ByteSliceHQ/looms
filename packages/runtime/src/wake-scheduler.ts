import { Clock, Effect, Fiber } from 'effect'

export interface WakeScheduler {
  schedule(runId: string, at: number): Effect.Effect<void>
  cancel(runId: string): Effect.Effect<void>
  /**
   * Optional. While a wake has in-process effects in flight it asks to be woken at `until`, renews
   * that before it passes, and clears it with `null` when the wake ends. Implement it only where
   * the wake outlives the process (a Durable Object alarm): if the process is lost mid-effect the
   * deadline fires elsewhere and the run re-attempts the effect. It must not replace the deadline
   * set through `schedule`; the host wakes at the earlier of the two.
   */
  keepAlive?(runId: string, until: number | null): Effect.Effect<void>
  dispose?(): void
}

export function createTimeoutScheduler(
  wake: (runId: string) => Effect.Effect<void>,
): WakeScheduler {
  const scheduled = new Map<string, { fiber: Fiber.Fiber<void>; token: symbol }>()

  const cancel = (runId: string): Effect.Effect<void> =>
    Effect.gen(function* () {
      const existing = scheduled.get(runId)

      if (existing) {
        scheduled.delete(runId)
        yield* Fiber.interrupt(existing.fiber)
      }
    })

  return {
    schedule: (runId, timerAt) =>
      Effect.gen(function* () {
        yield* cancel(runId)

        const now = yield* Clock.currentTimeMillis
        const token = Symbol(runId)

        const release = Effect.sync(() => {
          if (scheduled.get(runId)?.token === token) {
            scheduled.delete(runId)
          }
        })

        const fiber = yield* Effect.sleep(Math.max(0, timerAt - now + 5)).pipe(
          Effect.andThen(release),
          Effect.andThen(wake(runId)),
          Effect.ensuring(release),
          Effect.forkDetach,
        )

        scheduled.set(runId, { fiber, token })
      }),

    cancel,

    dispose() {
      for (const { fiber } of scheduled.values()) {
        Effect.runFork(Fiber.interrupt(fiber))
      }

      scheduled.clear()
    },
  }
}
