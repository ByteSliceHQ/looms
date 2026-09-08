import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { defineEffect, type EffectContext } from './effects'

const ctx: EffectContext = {
  effectId: 'eff_1',
  runId: 'run_1',
  threadId: 'thr_1',
  causingEventId: 'evt_1',
  emit: () => undefined,
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
})
