import { Effect, Schedule, type Layer } from 'effect'

import {
  asJson,
  isPrimitiveEffect,
  isWaitOnTimer,
  type ComposedRegistry,
  type EffectContext,
  type EventInput,
  type RegisteredDefinition,
  type RuntimeEffect,
} from '@looms/core'

import { threadStartedEvents } from './runtime-helpers'

export function dispatchEffect(
  registry: ComposedRegistry,
  services: Layer.Layer<any>,
  definitions: ReadonlyMap<string, RegisteredDefinition>,
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
        {
          type: 'runtime.effect.failed',
          payload: { effectId: effCtx.effectId, error: `No handler for ${eff.type}` },
          threadId: currentThreadId,
        },
      ])
    }

    const input = 'input' in eff ? eff.input : {}

    let execution: Effect.Effect<ReadonlyArray<EventInput>, Error> = handler
      .execute(input, effCtx)
      .pipe(Effect.provide(services))

    if (handler.retry && handler.retry.maxAttempts > 1) {
      const retryPolicy = handler.retry
      const backoff = retryPolicy.backoffMs ?? 100

      execution = execution.pipe(
        Effect.retry({
          times: retryPolicy.maxAttempts - 1,
          schedule: Schedule.spaced(backoff),
        }),
      )
    }

    return execution.pipe(
      Effect.catch((err) =>
        Effect.succeed([
          {
            type: 'runtime.effect.failed',
            payload: {
              effectId: effCtx.effectId,
              error: err instanceof Error ? err.message : String(err),
            },
            threadId: currentThreadId,
          },
        ]),
      ),
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
