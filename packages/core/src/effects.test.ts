import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { defineEffect, type EffectContext } from './effects'
import { validateInputEffect } from './schema'

const ctx: EffectContext = {
  effectId: 'eff_1',
  runId: 'run_1',
  threadId: 'thr_1',
  causingEventId: 'evt_1',
  emit: async () => undefined,
}

describe('defineEffect', () => {
  test('accepts a synchronous handler', async () => {
    const effect = defineEffect({
      type: 'demo.ping',
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
      input: Schema.Struct({ amount: Schema.Number }),
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
      input: Schema.Struct({ amount: Schema.Number }),
      execute: (input) => [{ type: 'demo.charged', payload: { amount: input.amount } }],
    })

    expect(effect.input).toBeDefined()

    const events = await Effect.runPromise(effect.execute({ amount: 99 }, ctx))
    expect(events).toEqual([{ type: 'demo.charged', payload: { amount: 99 } }])
  })

  test('validateInputEffect returns typed InvalidInputError with issues catchable by catchTag', async () => {
    const schema = Schema.Struct({ name: Schema.String, age: Schema.Number })

    const result = await Effect.runPromise(
      // SAFETY: invalid age is a fixture that must fail schema validation.
      validateInputEffect(schema, { name: 'Alice', age: 'invalid' as any }).pipe(
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
