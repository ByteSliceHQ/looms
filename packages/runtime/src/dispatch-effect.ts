import type { Context, ManagedRuntime } from 'effect'
import { Effect, Predicate } from 'effect'

import {
  asJson,
  isPrimitiveEffect,
  isWaitOnTimer,
  readEffectFailure,
  type ComposedRegistry,
  type EffectContext,
  type EventInput,
  RunLauncherTag,
  type RegisteredDefinition,
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
  const retryAfterMs = failure?.retryAfterMs

  if (failure?.nonRetryable && retryAfterMs !== undefined) {
    return {
      type: 'runtime.effect.failed',
      payload: { effectId, error, nonRetryable: true, retryAfterMs },
      threadId,
    }
  }

  if (failure?.nonRetryable) {
    return {
      type: 'runtime.effect.failed',
      payload: { effectId, error, nonRetryable: true },
      threadId,
    }
  }

  if (retryAfterMs !== undefined) {
    return {
      type: 'runtime.effect.failed',
      payload: { effectId, error, retryAfterMs },
      threadId,
    }
  }

  return { type: 'runtime.effect.failed', payload: { effectId, error }, threadId }
}

export function dispatchEffect(
  registry: ComposedRegistry,
  services: ManagedRuntime.ManagedRuntime<Context.Service.Any, never>,
  definitions: ReadonlyMap<string, RegisteredDefinition>,
  launcher: RunLauncher,
  effect: RuntimeEffect,
  ctx: EffectContext,
): Effect.Effect<ReadonlyArray<EventInput>, Error> {
  const currentThreadId = ctx.threadId

  const baseDispatch = (
    eff: RuntimeEffect,
    effCtx: EffectContext,
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

        default: {
          const exhaustiveCheck: never = eff
          return exhaustiveCheck
        }
      }
    }

    const handler = registry.effects.get(eff.type)

    if (!handler) {
      return Effect.succeed([
        failedAttempt(effCtx.effectId, currentThreadId, `No handler for ${eff.type}`),
      ])
    }

    const input = 'input' in eff ? eff.input : {}

    const execution: Effect.Effect<ReadonlyArray<EventInput>, Error> = Effect.gen(function* () {
      const serviceContext = yield* services.contextEffect

      return yield* handler
        .execute(input, effCtx)
        .pipe(Effect.provideService(RunLauncherTag, launcher), Effect.provide(serviceContext))
    })

    return execution.pipe(
      Effect.catch((err) => Effect.succeed([failedAttempt(effCtx.effectId, currentThreadId, err)])),
    )
  }

  if (registry.middleware && registry.middleware.length > 0) {
    const pipeline = registry.middleware.reduceRight<
      (e: RuntimeEffect, c: EffectContext) => Effect.Effect<ReadonlyArray<EventInput>, Error>
    >((next, mw) => (e, c) => mw(e, c, next), baseDispatch)

    return pipeline(effect, ctx)
  }

  return baseDispatch(effect, ctx)
}
