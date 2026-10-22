import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { invoke } from './effects'
import { createEvent } from './envelope'
import { foldRun, stableEffectId } from './fold'
import { composeModules, defineRuntimeModule } from './index'
import { defineThread } from './thread'

const catalog = defineEventCatalog('gen', {
  advanced: Schema.Struct({ generation: Schema.Finite }),
})

const thread = defineThread({
  kind: 'gen',
  forgetsCompletedEffects: true,
  initialState: () => ({ generation: 0 }),
  step(state, event) {
    return event.type === 'gen.advanced' ? { generation: event.payload.generation } : state
  },
  effects(state) {
    return [invoke('gen.work', null, `gen:${state.generation}`)]
  },
})

const registry = composeModules([
  defineRuntimeModule({
    namespace: 'gen',
    protocolVersion: '1.0.0',
    events: catalog,
    threads: { gen: thread },
  }),
])

describe('forgetsCompletedEffects', () => {
  test('drops completed effect ids the thread no longer enables', () => {
    const runId = 'run_1'
    const threadId = 'thr_1'

    const events = [
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: {
          rootThreadId: threadId,
          kind: 'gen',
          definitionName: 'gen',
          input: null,
        },
        threadId: null,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'gen',
          definitionName: 'gen',
          definitionVersion: 'v1',
          input: null,
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
    ]

    for (let generation = 0; generation < 40; generation += 1) {
      const effectId = stableEffectId(threadId, invoke('gen.work', null, `gen:${generation}`))

      events.push(
        createEvent(runId, {
          type: 'gen.advanced',
          payload: { generation: generation + 1 },
          threadId,
          effectId,
          origin: { type: 'effect', effectId: effectId ?? 'missing' },
        }),
      )
    }

    const state = foldRun(
      events.map((event, index) => ({ ...event, seq: index + 1 })),
      registry,
      { runId },
    )

    expect(state.completedEffectIds.length).toBeLessThan(3)
  })
})
