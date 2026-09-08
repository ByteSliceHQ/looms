import { describe, expect, test } from 'bun:test'
import { composeModules, createEvent, foldRun } from '@looms/core'
import { defineWorkflow } from './definitions'
import { workflow } from './module'

describe('@looms/workflow module', () => {
  test('started thread requests schedule', () => {
    const registry = composeModules([workflow()])
    const state = foldRun(
      [
        {
          ...createEvent('run_w', {
            type: 'runtime.thread.started',
            payload: {
              threadId: 'thr_w',
              kind: 'workflow',
              definitionName: 'pipe',
              input: { nodeIds: ['a'] },
              parentThreadId: null,
            },
            threadId: 'thr_w',
            origin: { type: 'system' },
          }),
          seq: 1,
        },
      ],
      registry,
    )
    expect(state.outstandingEffects[0]?.effect.type).toBe('workflow.schedule')
  })

  test('defineWorkflow sets kind', () => {
    const def = defineWorkflow({
      name: 'pipe',
      nodes: [{ id: 'a', run: () => 1 }],
    })
    expect(def.kind).toBe('workflow')
  })
})
