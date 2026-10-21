import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  complete,
  defineEffect,
  defineEventCatalog,
  defineRuntimeModule,
  defineThread,
  invoke,
} from '@looms/core'

import { createLooms } from './looms'
import type { WakeScheduler } from './wake-scheduler'

const catalog = defineEventCatalog('defer', {
  done: Schema.Struct({}),
})

const tick = defineEffect({
  type: 'defer.tick',
  execute: (_input, ctx) => [{ type: 'defer.done', payload: {}, threadId: ctx.threadId }],
})

const thread = defineThread({
  kind: 'defer',
  input: Schema.Struct({ at: Schema.Finite }),
  initialState: (ctx) => ({ at: ctx.input?.at ?? 0, done: false }),
  step: (state, event) => (event.type === 'defer.done' ? { ...state, done: true } : state),
  effects: (state) =>
    state.done ? [complete({ ok: true })] : [invoke(tick, null, 'tick', { at: state.at })],
})

const deferModule = defineRuntimeModule({
  namespace: 'defer',
  protocolVersion: '1.0.0',
  events: catalog,
  threads: { defer: thread },
  effects: { tick },
  definitions: [
    { kind: 'defer', name: 'defer', version: 'v1', input: Schema.Struct({ at: Schema.Finite }) },
  ],
})

describe('deferred invoke', () => {
  test('runs a due effect and only schedules one that is still ahead', async () => {
    const scheduled: number[] = []

    const scheduler: WakeScheduler = {
      schedule: (_runId, at) =>
        Effect.sync(() => {
          scheduled.push(at)
        }),
      cancel: () => Effect.void,
    }

    const looms = createLooms({ modules: [deferModule], scheduler })
    const definition = { kind: 'defer', name: 'defer', version: 'v1' }

    try {
      const past = await looms.start(definition, { at: 1 }, { runId: 'past' })
      expect(past.state.status).toBe('completed')

      const ahead = Date.now() + 60_000
      const future = await looms.start(definition, { at: ahead }, { runId: 'future' })
      expect(future.state.status).toBe('running')
      expect(scheduled).toContain(ahead)

      const events = await looms.getEvents('future')
      expect(events.some((event) => event.type === 'defer.done')).toBe(false)
    } finally {
      await looms.stop()
    }
  })
})
