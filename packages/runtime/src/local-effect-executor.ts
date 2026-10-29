import { Effect, Option, Predicate, type Context, type ManagedRuntime } from 'effect'

import {
  createEvent,
  createRunId,
  DEFAULT_DEFINITION_VERSION,
  validateEventInput,
  withdrawnError,
  type ComposedRegistry,
  type EventEnvelope,
  type EventInput,
  type DefinitionResolver,
  type OutstandingEffect,
  type LaunchRunArgs,
  type RunAttributes,
  type RunLauncher,
  type RunLaunchSource,
  type SecretContext,
  type TraceContext,
} from '@looms/core'

import { dispatchEffect } from './dispatch-effect'
import { admitOrFailAttempt } from './effect-admission'
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
  readonly definitionResolver: DefinitionResolver
  readonly executionContext: RunExecutionContext
  readonly liveAppends: RuntimeRepository['liveAppends']
  readonly runInContext: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>
  readonly observe: (event: Parameters<RuntimeObserver['observe']>[0]) => void
  readonly launcher: RunLauncher
}

/** Run-level values every effect sees. Runs the effects launch inherit them unless the launch overrides them. */
export interface RunContext {
  readonly correlationId: string
  readonly attributes: RunAttributes
  readonly secrets: SecretContext
  readonly trace: TraceContext | null
}

export interface ExecuteLocalEffectsInput {
  readonly runId: string
  readonly context: RunContext
  readonly outstanding: ReadonlyArray<OutstandingEffect>
  readonly attempts: ReadonlyMap<string, number>
  readonly now: number
}

function runLaunchedPayload(args: LaunchRunArgs, targetRunId: string, effectId: string) {
  const definitionVersion = args.definitionVersion ?? DEFAULT_DEFINITION_VERSION

  const base = {
    runId: targetRunId,
    kind: args.kind,
    definitionName: args.definitionName,
    definitionVersion,
    effectId,
  }

  if (args.close === undefined) {
    return base
  }

  return { ...base, close: args.close }
}

/**
 * Stamps every launch with the effect that made it, replacing anything the handler passed, and
 * records a `runtime.run.launched` event for each launch the target accepts.
 */
function launcherFor(
  launcher: RunLauncher,
  runId: string,
  context: RunContext,
  item: OutstandingEffect,
  launched: EventEnvelope[],
): RunLauncher {
  const launchedBy: RunLaunchSource = {
    runId,
    threadId: item.threadId,
    effectId: item.effectId,
    causationId: item.causingEventId,
    causationSeq: item.causingSeq,
  }

  return {
    launch: (args) => {
      const targetRunId = args.runId ?? createRunId()

      return launcher
        .launch({
          ...args,
          runId: targetRunId,
          launchedBy,
          correlationId: context.correlationId,
          attributes: args.attributes ?? context.attributes,
          secrets: args.secrets ?? context.secrets,
          trace: args.trace ?? context.trace ?? undefined,
        })
        .pipe(
          Effect.tap(() =>
            Effect.sync(() => {
              launched.push(
                createEvent(runId, {
                  type: 'runtime.run.launched',
                  payload: runLaunchedPayload(args, targetRunId, item.effectId),
                  threadId: item.threadId,
                  causationId: item.causingEventId,
                  correlationId: context.correlationId,
                  origin: { type: 'thread', threadId: item.threadId },
                }),
              )
            }),
          ),
        )
    },
    status: launcher.status,
    signal: (targetRunId, events, options) => launcher.signal(targetRunId, events, options),
    cancel: (targetRunId) => launcher.cancel(targetRunId),
  }
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
  const {
    registry,
    services,
    definitionResolver,
    executionContext,
    liveAppends,
    runInContext,
    observe,
    launcher,
  } = options

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

          const retry = registry.effects.get(item.effect.type)?.retry
          const launched: EventEnvelope[] = []
          const attemptNumber = input.attempts.get(item.effectId) ?? 1

          const admission = yield* admitOrFailAttempt({
            registry,
            item,
            runId: input.runId,
            attempt: attemptNumber,
            now: input.now,
            attributes: input.context.attributes,
            secrets: input.context.secrets,
            trace: input.context.trace,
            retry,
          })

          if (admission._tag === 'reject') {
            if (admission.observation) {
              observe(admission.observation)
            }

            produced.push(admission.event)
            failedEffectId = item.effectId
            continue
          }

          const controller = makeAbortController()

          executionContext.activeEffects.set(item.effectId, {
            controller,
            threadId: item.threadId,
          })

          const dispatched = dispatchEffect(
            registry,
            services,
            definitionResolver,
            launcherFor(launcher, input.runId, input.context, item, launched),
            item.effect,
            {
              placement: 'local',
              effectId: item.effectId,
              runId: input.runId,
              threadId: item.threadId,
              causingEventId: item.causingEventId,
              attributes: input.context.attributes,
              secrets: input.context.secrets,
              trace: input.context.trace,
              signal: controller.signal,
              heartbeat: () => Promise.resolve(),
              emit: appendLive,
            },
          ).pipe(
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

          // A launch the target accepted happened even if the attempt was later aborted or failed.
          produced.push(...launched)

          if (settled._tag === 'aborted') {
            continue
          }

          const before = produced.length

          if (settled._tag === 'timed-out') {
            controller.abort(new RuntimeExecutionError('start-to-close timeout'))

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

          // A handler that returns no events succeeded with nothing to report (a launch, a
          // cancel, or a scheduler with nothing ready). Record the attempt as completed, as the
          // worker path does; treating it as a failure made the thread re-request the same
          // effect from the failure event and spin the wake loop.
          if (outcomes.length === 0) {
            const attempt = input.attempts.get(item.effectId) ?? 1

            produced.push(
              createEvent(input.runId, {
                type: 'runtime.effect.completed',
                payload: { effectId: item.effectId, attempt },
                threadId: item.threadId,
                effectId: item.effectId,
                causationId: item.causingEventId,
                origin: { type: 'system' },
              }),
            )
          }

          for (const outcome of outcomes) {
            if (outcome.type === 'runtime.effect.failed') {
              const attempt = input.attempts.get(item.effectId) ?? 1
              const payload = Predicate.isObject(outcome.payload) ? outcome.payload : {}
              const error = Predicate.isString(payload.error) ? payload.error : 'effect failed'
              const retryAfterMs = payload.retryAfterMs

              const failure = planAttemptFailure({
                runId: input.runId,
                item,
                attempt,
                error,
                now: input.now,
                retry,
                origin: { type: 'system' },
                nonRetryable: payload.nonRetryable === true,
                retryAfterMs: Predicate.isNumber(retryAfterMs) ? retryAfterMs : undefined,
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
