import { Effect, Option, Predicate, type Context, type ManagedRuntime } from 'effect'

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
import { RuntimeExecutionError } from './errors'
import {
  createEffectFailedEvent,
  createLiveEvent,
  groupOutstanding,
  materializeEffectOutcome,
} from './helpers'
import type { RuntimeObserver } from './observer'
import type { RuntimeRepository } from './repository'
import { planAttemptFailure } from './retry-policy'
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

type LocalAttempt =
  | { readonly _tag: 'completed'; readonly outcomes: ReadonlyArray<EventInput> }
  | { readonly _tag: 'aborted' }
  | { readonly _tag: 'timed-out' }

function makeAbortController(): AbortController {
  return new AbortController()
}

/** Completes when the signal aborts, so racing it interrupts a handler that ignores the signal. */
function abortion(signal: AbortSignal): Effect.Effect<LocalAttempt> {
  return Effect.callback<LocalAttempt>((resume) => {
    const onAbort = () => resume(Effect.succeed({ _tag: 'aborted' }))

    if (signal.aborted) {
      onAbort()
      return Effect.void
    }

    signal.addEventListener('abort', onAbort, { once: true })
    return Effect.sync(() => signal.removeEventListener('abort', onAbort))
  })
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

          const retry = registry.effects.get(item.effect.type)?.retry

          const dispatched = dispatchEffect(registry, services, definitions, item.effect, {
            effectId: item.effectId,
            runId: input.runId,
            threadId: item.threadId,
            causingEventId: item.causingEventId,
            signal: controller.signal,
            emit: appendLive,
          }).pipe(
            Effect.map((outcomes): LocalAttempt => ({ _tag: 'completed', outcomes })),
            Effect.raceFirst(abortion(controller.signal)),
          )

          const settled = yield* (
            retry?.startToCloseTimeoutMs
              ? dispatched.pipe(
                  Effect.timeoutOption(retry.startToCloseTimeoutMs),
                  Effect.map(Option.getOrElse((): LocalAttempt => ({ _tag: 'timed-out' }))),
                )
              : dispatched
          ).pipe(
            Effect.ensuring(
              Effect.sync(() => {
                executionContext.activeEffects.delete(item.effectId)
              }),
            ),
          )

          if (settled._tag === 'aborted') {
            continue
          }

          const before = produced.length

          if (settled._tag === 'timed-out') {
            controller.abort(new RuntimeExecutionError('start-to-close timeout'))
            const attemptNumber = input.attempts.get(item.effectId) ?? 1

            observe({
              type: 'effect.timeout',
              runId: input.runId,
              at: input.now,
              effectId: item.effectId,
              attempt: attemptNumber,
              detail: 'start-to-close',
            })

            produced.push(
              createEvent(input.runId, {
                type: 'runtime.effect.timed_out',
                payload: {
                  effectId: item.effectId,
                  attempt: attemptNumber,
                  timeout: 'start-to-close',
                },
                threadId: item.threadId,
                causationId: item.causingEventId,
                origin: { type: 'system' },
              }),
              planAttemptFailure({
                runId: input.runId,
                item,
                attempt: attemptNumber,
                error: 'start-to-close timeout',
                now: input.now,
                retry,
                origin: { type: 'system' },
              }).event,
            )

            failedEffectId = item.effectId
            continue
          }

          const { outcomes } = settled

          if (outcomes.length === 0) {
            produced.push(createEffectFailedEvent(input.runId, item, 'empty-outcome'))
          }

          for (const outcome of outcomes) {
            if (outcome.type === 'runtime.effect.failed') {
              const attempt = input.attempts.get(item.effectId) ?? 1
              const payload = Predicate.isObject(outcome.payload) ? outcome.payload : {}
              const error = Predicate.isString(payload.error) ? payload.error : 'effect failed'

              const failure = planAttemptFailure({
                runId: input.runId,
                item,
                attempt,
                error,
                now: input.now,
                retry,
                origin: { type: 'system' },
              })

              if (failure.retrying) {
                observe({
                  type: 'effect.retry',
                  runId: input.runId,
                  at: input.now,
                  effectId: item.effectId,
                  attempt,
                  detail: error,
                })

                produced.push(failure.event)
                continue
              }
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
