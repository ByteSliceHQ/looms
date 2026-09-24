import { Clock, Effect } from 'effect'

import {
  createEvent,
  EventStoreTag,
  foldRun,
  type ComposedRegistry,
  type EffectExecutionRecord,
  type EventEnvelope,
  type OutstandingEffect,
  type RunState,
} from '@looms/core'

import { RuntimeExecutionError } from './errors'
import { waitSatisfiedEvents, workerTask } from './helpers'
import type { RunIngress } from './ingress'
import { notifyObserver, type RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import type { RunExecutionContexts } from './run-execution-context'
import type { EffectWorker, LoomsRuntime } from './types'
import { isWorkerEffect } from './worker-effect-dispatch'

export interface CancellationOptions {
  readonly registry: ComposedRegistry
  readonly repository: RuntimeRepository
  readonly executionContexts: RunExecutionContexts
  readonly worker?: EffectWorker
  readonly observer?: RuntimeObserver
  readonly wake: LoomsRuntime['wake']
  readonly withRunIngress: RunIngress
}

interface WorkerCancellation {
  readonly item: OutstandingEffect
  readonly execution: EffectExecutionRecord
}

interface CancellationPlan {
  readonly events: ReadonlyArray<EventEnvelope>
  readonly threadIds: ReadonlySet<string>
  readonly workerCancellations: ReadonlyArray<WorkerCancellation>
}

function descendantThreadIds(state: RunState, targetThreadId: string): string[] {
  return Object.values(state.threads)
    .filter((record) => {
      let parentThreadId = record.parentThreadId

      while (parentThreadId) {
        if (parentThreadId === targetThreadId) {
          return true
        }

        parentThreadId = state.threads[parentThreadId]?.parentThreadId ?? null
      }

      return false
    })
    .map((record) => record.threadId)
}

/**
 * Cancel a thread and its descendants. Worker attempts in flight are asked to stop and must
 * acknowledge; attempts waiting to retry were never handed out and are cancelled outright.
 */
function planCancellation(input: {
  readonly runId: string
  readonly state: RunState
  readonly threadId: string | undefined
  readonly registry: ComposedRegistry
  readonly worker: EffectWorker | undefined
  readonly now: number
}): CancellationPlan {
  const { runId, state, registry, now } = input
  const targetThreadId = input.threadId ?? state.rootThreadId ?? ''
  const idempotencyKey = `cancel:${targetThreadId}`

  if (state.processedIdempotencyKeys.includes(idempotencyKey)) {
    return { events: [], threadIds: new Set(), workerCancellations: [] }
  }

  const descendants = descendantThreadIds(state, targetThreadId)
  const threadIds = new Set([...descendants, targetThreadId])
  const workerCancellations: WorkerCancellation[] = []
  const effectEvents: EventEnvelope[] = []

  for (const item of state.outstandingEffects) {
    const execution = state.effectExecutions[item.effectId]

    if (
      !execution ||
      !threadIds.has(item.threadId) ||
      !isWorkerEffect({ runId, item, execution, registry, worker: input.worker })
    ) {
      continue
    }

    if (execution.status === 'retry_wait') {
      effectEvents.push(
        createEvent(runId, {
          type: 'runtime.effect.cancelled',
          payload: { effectId: item.effectId, attempt: execution.attempt },
          threadId: item.threadId,
          effectId: item.effectId,
          origin: { type: 'system' },
          idempotencyKey,
        }),
      )

      continue
    }

    const timeoutMs = registry.effects.get(item.effect.type)?.retry?.cancellationTimeoutMs
    workerCancellations.push({ item, execution })

    effectEvents.push(
      createEvent(runId, {
        type: 'runtime.effect.cancel.requested',
        payload: {
          effectId: item.effectId,
          attempt: execution.attempt,
          deadlineAt: timeoutMs ? now + timeoutMs : null,
        },
        threadId: item.threadId,
        origin: { type: 'system' },
        idempotencyKey,
      }),
    )
  }

  const threadEvents = [
    ...descendants.map((_, index) => descendants[descendants.length - 1 - index]!),
    targetThreadId,
  ]
    .filter((threadId) => threadId.length > 0)
    .map((threadId) =>
      createEvent(runId, {
        type: 'runtime.thread.cancelled',
        payload: { threadId, reason: 'cancelled' },
        threadId,
        origin: { type: 'external' },
        idempotencyKey,
      }),
    )

  const batch = [...effectEvents, ...threadEvents]
  const folded = foldRun(batch, registry, { runId, initial: state })

  const satisfied = waitSatisfiedEvents(folded, batch).map((event) => createEvent(runId, event))

  return { events: [...batch, ...satisfied], threadIds, workerCancellations }
}

export function createCancellation(options: CancellationOptions): LoomsRuntime['cancel'] {
  const { registry, repository, executionContexts, worker } = options

  return (runId, threadId) =>
    Effect.gen(function* () {
      const committed = yield* options.withRunIngress(
        runId,
        Effect.gen(function* () {
          const store = yield* EventStoreTag
          const now = yield* Clock.currentTimeMillis

          return yield* repository.commit(store, runId, (current) => {
            const plan = planCancellation({
              runId,
              state: current.state,
              threadId,
              registry,
              worker,
              now,
            })

            return Effect.succeed({
              events: plan.events,
              value: { plan, now },
              idempotencyKey: `signal:cancel:${threadId ?? current.state.rootThreadId ?? ''}`,
            })
          })
        }),
      )

      const { plan, now } = committed.value

      if (committed.append) {
        executionContexts.abort(runId, plan.threadIds, 'Effect cancelled')

        for (const { item, execution } of plan.workerCancellations) {
          notifyObserver(options.observer, {
            type: 'effect.cancellation',
            runId,
            at: now,
            effectId: item.effectId,
            attempt: execution.attempt,
          })
        }
      }

      const cancelledState = yield* options.wake(runId)

      if (worker?.cancel && committed.append) {
        yield* Effect.forEach(
          plan.workerCancellations,
          ({ item, execution }) =>
            Effect.tryPromise({
              try: () =>
                Promise.resolve(worker.cancel?.(workerTask(runId, item, execution.attempt))),
              catch: (cause) =>
                new RuntimeExecutionError(cause instanceof Error ? cause.message : String(cause)),
            }).pipe(Effect.ignore),
          { concurrency: 'unbounded', discard: true },
        )
      }

      return cancelledState
    })
}
