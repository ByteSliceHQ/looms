import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { defineEffect, waitOutcome, type EffectContext } from './effects'
import { validateInputEffect } from './schema'

const ctx: EffectContext = {
  placement: 'local',
  effectId: 'eff_1',
  runId: 'run_1',
  threadId: 'thr_1',
  causingEventId: 'evt_1',
  attributes: {},
  secrets: {},
  signal: new AbortController().signal,
  trace: null,
  heartbeat: async () => undefined,
  emit: async () => undefined,
}

describe('defineEffect', () => {
  test('accepts a synchronous handler', async () => {
    const effect = defineEffect({
      type: 'demo.ping',
      placement: 'local',
      execute: (_input, handlerCtx) => [
        { type: 'demo.pong', payload: { effectId: handlerCtx.effectId } },
      ],
    })

    const events = await Effect.runPromise(effect.execute({}, ctx))
    expect(events).toEqual([{ type: 'demo.pong', payload: { effectId: 'eff_1' } }])
  })

  test('accepts a promise handler', async () => {
    const effect = defineEffect({
      type: 'demo.ping',
      placement: 'local',
      execute: async (_input, handlerCtx) => [
        { type: 'demo.pong', payload: { effectId: handlerCtx.effectId } },
      ],
    })

    const events = await Effect.runPromise(effect.execute({}, ctx))
    expect(events).toEqual([{ type: 'demo.pong', payload: { effectId: 'eff_1' } }])
  })

  test('preserves validateInput error messages', async () => {
    const effect = defineEffect({
      type: 'demo.charge',
      placement: 'local',
      input: Schema.Struct({ amount: Schema.Finite }),
      execute: () => [],
    })

    let message = ''

    try {
      await Effect.runPromise(effect.execute({}, ctx))
    } catch (err) {
      message = err instanceof Error ? err.message : String(err)
    }

    expect(message).toContain('amount')
    expect(message).not.toContain('An error occurred in Effect.tryPromise')
  })

  test('infers input type from input schema', async () => {
    const effect = defineEffect({
      type: 'demo.charge',
      placement: 'local',
      input: Schema.Struct({ amount: Schema.Finite }),
      execute: (input) => [{ type: 'demo.charged', payload: { amount: input.amount } }],
    })

    expect(effect.input).toBeDefined()

    const events = await Effect.runPromise(effect.execute({ amount: 99 }, ctx))
    expect(events).toEqual([{ type: 'demo.charged', payload: { amount: 99 } }])
  })

  test('marks definitions with a handler', () => {
    const effect = defineEffect({ type: 'demo.ping', placement: 'local', execute: () => [] })

    expect(effect.hasHandler).toBe(true)
    expect(effect.placement).toBe('local')
  })

  test('declares a handler-less effect that still validates input', async () => {
    const effect = defineEffect({
      type: 'demo.transcode',
      placement: 'worker',
      input: Schema.Struct({ url: Schema.String }),
      retry: { maxAttempts: 3 },
    })

    expect(effect.hasHandler).toBe(false)
    expect(effect.retry).toEqual({ maxAttempts: 3 })

    const events = await Effect.runPromise(effect.execute({ url: 'https://example.com' }, ctx))
    expect(events).toEqual([])

    expect(Effect.runPromise(effect.execute({ url: 1 }, ctx))).rejects.toThrow('url')
  })

  test('marks local placement from the placement field', () => {
    const effect = defineEffect({ type: 'demo.local', placement: 'local', execute: () => [] })

    expect(effect.placement).toBe('local')
  })

  test('validateInputEffect returns typed InvalidInputError with issues catchable by catchTag', async () => {
    const schema = Schema.Struct({ name: Schema.String, age: Schema.Finite })

    const result = await Effect.runPromise(
      validateInputEffect(schema, { name: 'Alice', age: 'invalid' }).pipe(
        Effect.map(() => 'valid'),
        Effect.catchTag('InvalidInputError', (err) =>
          Effect.succeed({ tag: err._tag, issues: err.issues.length, msg: err.message }),
        ),
      ),
    )

    expect(result).toMatchObject({
      tag: 'InvalidInputError',
      issues: 1,
    })
  })
})

describe('waitOutcome', () => {
  test('returns the payload output of the satisfying event', () => {
    expect(waitOutcome({ type: 'x', payload: { output: 42 } }, { nodeId: 'a' })).toEqual({
      result: 42,
      error: null,
    })
  })

  test('fails with the payload error', () => {
    expect(waitOutcome({ type: 'x', payload: { error: 'boom' } }, {})).toEqual({
      result: null,
      error: 'boom',
    })
  })

  test('fails with an error the waiter put on the tag', () => {
    const satisfied = { type: 'runtime.timer.fired', payload: { at: 1 } }

    expect(waitOutcome(satisfied, { error: 'Approval a timed out' })).toEqual({
      result: null,
      error: 'Approval a timed out',
    })
  })

  test('uses the fallback when there is no satisfying event', () => {
    expect(waitOutcome(undefined, {}, { waited: true })).toEqual({
      result: { waited: true },
      error: null,
    })
  })
})
