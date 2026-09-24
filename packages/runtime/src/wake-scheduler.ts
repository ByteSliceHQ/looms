import { Clock, Effect, Fiber } from 'effect'

export interface WakeScheduler {
  schedule(runId: string, at: number): Effect.Effect<void>
  cancel(runId: string): Effect.Effect<void>
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
