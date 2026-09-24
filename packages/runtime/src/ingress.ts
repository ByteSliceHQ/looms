import { Data, Effect } from 'effect'

import type { RunExecutionContexts } from './run-execution-context'

export class RunOverloadedError extends Data.TaggedError('RunOverloadedError')<{
  readonly runId: string
  readonly limit: number
  readonly message: string
}> {
  constructor(runId: string, limit: number) {
    super({
      runId,
      limit,
      message: `Run "${runId}" has reached its pending operation limit (${limit})`,
    })

    this.name = 'RunOverloadedError'
  }
}

export type RunIngress = <A, E, R>(
  runId: string,
  operation: Effect.Effect<A, E, R>,
) => Effect.Effect<A, E | RunOverloadedError, R>

export function createRunIngress(
  executionContexts: RunExecutionContexts,
  maxPendingRunOperations: number,
): RunIngress {
  return <A, E, R>(
    runId: string,
    operation: Effect.Effect<A, E, R>,
  ): Effect.Effect<A, E | RunOverloadedError, R> =>
    Effect.suspend<A, E | RunOverloadedError, R>(() => {
      const context = executionContexts.get(runId)
      const current = context.ingress ?? { pending: 0, tail: Promise.resolve() }

      if (current.pending >= maxPendingRunOperations) {
        return Effect.fail(new RunOverloadedError(runId, maxPendingRunOperations))
      }

      let release!: () => void

      // Promise chaining is the admission queue; the workload itself remains an Effect.
      // oxlint-disable-next-line effecttsgo/new-promise
      const own = new Promise<void>((resolve) => {
        release = resolve
      })

      const previous = current.tail
      context.ingress = { pending: current.pending + 1, tail: own }

      return Effect.promise(() => previous).pipe(
        Effect.andThen(operation),
        Effect.ensuring(
          Effect.sync(() => {
            release()
            const latest = context.ingress

            if (!latest) {
              return
            }

            if (latest.pending <= 1) {
              context.ingress = null
            } else {
              context.ingress = { ...latest, pending: latest.pending - 1 }
            }

            executionContexts.releaseIfIdle(runId)
          }),
        ),
      )
    })
}
