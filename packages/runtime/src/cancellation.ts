import { Clock, Effect } from 'effect'

import { EventStoreTag, type ComposedRegistry } from '@looms/core'

import { RuntimeExecutionError } from './errors'
import { workerTask } from './helpers'
import type { RunIngress } from './ingress'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import type { EffectWorker, LoomsRuntime } from './types'
import { isWorkerEffect } from './worker-effect-dispatch'

export interface CancellationOptions {
  readonly registry: ComposedRegistry
  readonly repository: RuntimeRepository
  readonly worker?: EffectWorker
  readonly observer?: RuntimeObserver
  readonly runtime: () => LoomsRuntime
  readonly signalAdmitted: LoomsRuntime['signal']
  readonly withRunIngress: RunIngress
  readonly abortActiveEffects: (
    runId: string,
    threadIds: ReadonlySet<string>,
    message: string,
  ) => void
}

export function createCancellation(options: CancellationOptions): LoomsRuntime['cancel'] {
  const { registry, abortActiveEffects } = options
  const { loadCursor } = options.repository

  const observe = (event: Parameters<RuntimeObserver['observe']>[0]) =>
    notifyObserver(options.observer, event)

  return (runId, threadId) =>
    Effect.gen(function* () {
      const workerCancellations = yield* options.withRunIngress(
        runId,
        Effect.gen(function* () {
          const store = yield* EventStoreTag
          const current = yield* loadCursor(store, runId)
          const targetThreadId = threadId ?? current.state.rootThreadId ?? ''

          const descendants = Object.values(current.state.threads)
            .filter((record) => {
              let parentThreadId = record.parentThreadId

              while (parentThreadId) {
                if (parentThreadId === targetThreadId) {
                  return true
                }

                parentThreadId = current.state.threads[parentThreadId]?.parentThreadId ?? null
              }

              return false
            })
            .map((record) => record.threadId)

          const cancelledThreadIds = new Set([...descendants, targetThreadId])
          const now = yield* Clock.currentTimeMillis

          const cancellations = current.state.outstandingEffects.flatMap((item) => {
            const execution = current.state.effectExecutions[item.effectId]
            const retry = registry.effects.get(item.effect.type)?.retry
            const cancellationTimeoutMs = retry?.cancellationTimeoutMs

            if (
              !isWorkerEffect({ runId, item, execution, registry, worker: options.worker }) ||
              !execution ||
              !cancelledThreadIds.has(item.threadId)
            ) {
              return []
            }

            return [
              {
                item,
                execution,
                deadlineAt: cancellationTimeoutMs ? now + cancellationTimeoutMs : null,
              },
            ]
          })

          for (const { item, execution } of cancellations) {
            observe({
              type: 'effect.cancellation',
              runId,
              at: now,
              effectId: item.effectId,
              attempt: execution.attempt,
            })
          }

          abortActiveEffects(runId, cancelledThreadIds, 'Effect cancelled')

          yield* options.signalAdmitted(
            runId,
            [
              ...cancellations.map(({ item, execution, deadlineAt }) => ({
                type: 'runtime.effect.cancel.requested',
                payload: { effectId: item.effectId, attempt: execution.attempt, deadlineAt },
                threadId: item.threadId,
                origin: { type: 'system' as const },
              })),
              ...[
                ...descendants.map((_, index) => descendants[descendants.length - index - 1]!),
                targetThreadId,
              ]
                .filter((id) => id.length > 0)
                .map((id) => ({
                  type: 'runtime.thread.cancelled',
                  payload: { threadId: id, reason: 'cancelled' },
                  threadId: id,
                  origin: { type: 'external' as const },
                })),
            ],
            { idempotencyKey: `cancel:${targetThreadId}` },
          )

          return cancellations
        }),
      )

      const cancelledState = yield* options.runtime().wake(runId)

      if (options.worker?.cancel) {
        for (const { item, execution } of workerCancellations) {
          yield* Effect.tryPromise({
            try: () =>
              Promise.resolve(options.worker!.cancel!(workerTask(runId, item, execution.attempt))),
            catch: (cause) =>
              new RuntimeExecutionError(cause instanceof Error ? cause.message : String(cause)),
          }).pipe(Effect.ignore)
        }
      }

      return cancelledState
    })
}
