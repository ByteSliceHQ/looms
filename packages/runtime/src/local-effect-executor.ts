import { Effect, Predicate, type Context, type ManagedRuntime } from 'effect'

import {
  createEvent,
  validateEventInput,
  withdrawnError,
  type ComposedRegistry,
  type EventEnvelope,
  type EventInput,
  type OutstandingEffect,
  type RegisteredDefinition,
} from '@looms/core'

import { dispatchEffect } from './dispatch-effect'
import {
  createEffectFailedEvent,
  createLiveEvent,
  groupOutstanding,
  materializeEffectOutcome,
} from './helpers'
import type { RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import { retryBackoff } from './retry-policy'
import type { RunExecutionContext } from './run-execution-context'

export interface LocalEffectExecutorOptions {
  readonly registry: ComposedRegistry
  readonly services: ManagedRuntime.ManagedRuntime<Context.Service.Any, never>
  readonly definitions: ReadonlyMap<string, RegisteredDefinition>
  readonly executionContext: RunExecutionContext
  readonly liveAppends: RuntimeRepository['liveAppends']
  readonly runInContext: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>
  readonly observe: (event: Parameters<RuntimeObserver['observe']>[0]) => void
}

export interface ExecuteLocalEffectsInput {
  readonly runId: string
  readonly outstanding: ReadonlyArray<OutstandingEffect>
  readonly attempts: ReadonlyMap<string, number>
  readonly now: number
}

function makeAbortController(): AbortController {
  return new AbortController()
}

export function executeLocalEffects(
  options: LocalEffectExecutorOptions,
  input: ExecuteLocalEffectsInput,
): Effect.Effect<ReadonlyArray<EventEnvelope>, Error> {
  const { registry, services, definitions, executionContext, liveAppends, runInContext, observe } =
    options

  return Effect.forEach(
    groupOutstanding(input.outstanding),
    (groupKey) =>
      Effect.gen(function* () {
        const group = input.outstanding.filter(
          (item) => `${item.threadId}:${item.causingSeq}` === groupKey,
        )

        const produced: EventEnvelope[] = []
        let failedEffectId: string | undefined

        for (const item of group) {
          if (failedEffectId && item.effect.type === 'runtime.wait') {
            produced.push(
              createEffectFailedEvent(input.runId, item, withdrawnError(failedEffectId)),
            )

            continue
          }

          const appendLive = (eventInput: EventInput) =>
            runInContext(
              Effect.gen(function* () {
                const validated = yield* validateEventInput(registry.catalogs, eventInput)
                const liveEvent = createLiveEvent(input.runId, item, validated)

                if (liveEvent) {
                  yield* liveAppends.push(input.runId, liveEvent)
                }
              }),
            )

          const controller = makeAbortController()

          executionContext.activeEffects.set(item.effectId, {
            controller,
            threadId: item.threadId,
          })

          const outcomes = yield* dispatchEffect(registry, services, definitions, item.effect, {
            effectId: item.effectId,
            runId: input.runId,
            threadId: item.threadId,
            causingEventId: item.causingEventId,
            signal: controller.signal,
            emit: appendLive,
          }).pipe(
            Effect.ensuring(
              Effect.sync(() => {
                executionContext.activeEffects.delete(item.effectId)
              }),
            ),
          )

          if (controller.signal.aborted) {
            continue
          }

          const before = produced.length

          if (outcomes.length === 0) {
            produced.push(createEffectFailedEvent(input.runId, item, 'empty-outcome'))
          }

          for (const outcome of outcomes) {
            const attempt = input.attempts.get(item.effectId) ?? 1
            const retry = registry.effects.get(item.effect.type)?.retry

            if (outcome.type === 'runtime.effect.failed' && retry && attempt < retry.maxAttempts) {
              const payload = Predicate.isObject(outcome.payload) ? outcome.payload : {}
              const error = Predicate.isString(payload.error) ? payload.error : 'effect failed'

              observe({
                type: 'effect.retry',
                runId: input.runId,
                at: input.now,
                effectId: item.effectId,
                attempt,
                detail: error,
              })

              produced.push(
                createEvent(input.runId, {
                  type: 'runtime.effect.retry.scheduled',
                  payload: {
                    effectId: item.effectId,
                    attempt,
                    nextAttemptAt: input.now + retryBackoff(retry, attempt),
                    error,
                  },
                  threadId: item.threadId,
                  causationId: item.causingEventId,
                  origin: { type: 'system' },
                }),
              )

              continue
            }

            produced.push(
              yield* materializeEffectOutcome(registry.catalogs, input.runId, item, outcome),
            )
          }

          const itemOutcomes = produced.slice(before)

          if (
            item.effect.type !== 'runtime.wait' &&
            itemOutcomes.some((event) => event.type === 'runtime.effect.failed')
          ) {
            failedEffectId = item.effectId
          }
        }

        return produced
      }),
    { concurrency: 'unbounded' },
  ).pipe(Effect.map((groups) => groups.flat()))
}
