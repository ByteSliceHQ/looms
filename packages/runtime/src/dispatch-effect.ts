import type { Context, ManagedRuntime, Types } from 'effect'
import { Effect, Predicate } from 'effect'

import {
  asJson,
  EffectFailure,
  isLocalEffectDefinition,
  isPrimitiveEffect,
  isWaitOnTimer,
  readEffectFailure,
  type ComposedRegistry,
  type LocalEffectContext,
  type EffectFailedPayload,
  type EventInput,
  RunLauncherTag,
  type DefinitionResolver,
  type RunLauncher,
  type RuntimeEffect,
} from '@looms/core'

import { threadStartedEvents } from './helpers'

function causeMessage(cause: unknown): string {
  if (Predicate.isString(cause)) {
    return cause
  }

  if (cause instanceof Error) {
    return cause.message
  }

  return String(cause)
}

function failedAttempt(effectId: string, threadId: string, cause: unknown): EventInput {
  const failure = readEffectFailure(cause)
  const error = failure?.error ?? causeMessage(cause)
  const payload: Types.Mutable<EffectFailedPayload> = { effectId, error }

  if (failure?.nonRetryable) {
    payload.nonRetryable = true
  }

  if (failure?.retryAfterMs !== undefined) {
    payload.retryAfterMs = failure.retryAfterMs
  }

  return { type: 'runtime.effect.failed', payload, threadId }
}

export function dispatchEffect(
  registry: ComposedRegistry,
  services: ManagedRuntime.ManagedRuntime<Context.Service.Any, never>,
  definitions: DefinitionResolver,
  launcher: RunLauncher,
  effect: RuntimeEffect,
  ctx: LocalEffectContext,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  const currentThreadId = ctx.threadId

  const baseDispatch = (
    eff: RuntimeEffect,
    effCtx: LocalEffectContext,
  ): Effect.Effect<ReadonlyArray<EventInput>, Error> => {
    if (isPrimitiveEffect(eff)) {
      switch (eff.type) {
        case 'runtime.spawn': {
          const childThreadId = eff.childThreadId ?? ''
          return threadStartedEvents(definitions, {
            kind: eff.kind,
            definitionName: eff.definitionName,
            definitionVersion: eff.definitionVersion,
            input: eff.input,
            threadId: childThreadId,
            parentThreadId: currentThreadId,
          })
        }

        case 'runtime.wait': {
          const events: EventInput[] = [
            {
              type: 'runtime.wait.registered',
              payload: asJson({
                waitId: eff.waitId,
                threadId: currentThreadId,
                on: eff.on,
                tag: eff.tag ?? null,
              }),
              threadId: currentThreadId,
            },
          ]

          if (isWaitOnTimer(eff.on)) {
            events.push({
              type: 'runtime.timer.set',
              payload: { timerId: eff.waitId, waitId: eff.waitId, wakeAt: eff.on.timerAt },
              threadId: currentThreadId,
            })
          }

          return Effect.succeed(events)
        }

        case 'runtime.emit':
          return Effect.succeed([eff.event])
        case 'runtime.complete':
          return Effect.succeed([
            {
              type: 'runtime.thread.completed',
              payload: { threadId: currentThreadId, output: eff.output },
              threadId: currentThreadId,
            },
          ])
        case 'runtime.fail':
          return Effect.succeed([
            {
              type: 'runtime.thread.failed',
              payload: { threadId: currentThreadId, error: eff.error },
              threadId: currentThreadId,
            },
          ])

        case 'runtime.cancel': {
          const targetThreadId = eff.threadId ?? ''
          return Effect.succeed([
            {
              type: 'runtime.thread.cancelled',
              payload: { threadId: targetThreadId, reason: 'cancelled' },
              threadId: targetThreadId,
            },
          ])
        }

        case 'runtime.launch':
          return launcher
            .launch({
              runId: eff.runId,
              kind: eff.kind,
              definitionName: eff.definitionName,
              definitionVersion: eff.definitionVersion,
              input: eff.input,
              idempotencyKey: eff.runId,
              close: eff.close,
            })
            .pipe(Effect.map(() => []))

        case 'runtime.cancelRun':
          return launcher.cancel(eff.runId).pipe(Effect.map(() => []))

        default: {
          const exhaustiveCheck: never = eff
          return exhaustiveCheck
        }
      }
    }

    const definition = registry.effects.get(eff.type)

    if (!definition) {
      return Effect.succeed([
        failedAttempt(effCtx.effectId, currentThreadId, `No handler for ${eff.type}`),
      ])
    }

    if (!isLocalEffectDefinition(definition)) {
      return Effect.succeed([
        failedAttempt(
          effCtx.effectId,
          currentThreadId,
          new EffectFailure({
            error: `${eff.type} is worker-placed; the host cannot run it`,
            nonRetryable: true,
          }),
        ),
      ])
    }

    const input = 'input' in eff ? eff.input : {}

    const execution: Effect.Effect<ReadonlyArray<EventInput>, Error> = Effect.gen(function* () {
      const serviceContext = yield* services.contextEffect

      return yield* definition
        .execute(input, effCtx)
        .pipe(Effect.provideService(RunLauncherTag, launcher), Effect.provide(serviceContext))
    })

    return execution.pipe(
      Effect.catch((err) => Effect.succeed([failedAttempt(effCtx.effectId, currentThreadId, err)])),
    )
  }

  if (registry.middleware && registry.middleware.length > 0) {
    const pipeline = registry.middleware.reduceRight<
      (e: RuntimeEffect, c: LocalEffectContext) => Effect.Effect<ReadonlyArray<EventInput>, Error>
    >((next, mw) => (e, c) => mw(e, c, next), baseDispatch)

    // Middleware may call `failEffect` (or otherwise fail) before `next`. Catch those the same
    // way handler failures are caught inside `baseDispatch`, so a deliberate gate becomes
    // `runtime.effect.failed` instead of failing the wake.
    return pipeline(effect, ctx).pipe(
      Effect.catch((err) => Effect.succeed([failedAttempt(ctx.effectId, currentThreadId, err)])),
    )
  }

  return baseDispatch(effect, ctx)
}
