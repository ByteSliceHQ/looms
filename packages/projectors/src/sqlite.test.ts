import { describe, expect, test } from 'bun:test'

import { createEvent } from '@looms/core'

import { sqlite } from './sqlite'

describe('sqlite projector', () => {
  test('indexes a started run', async () => {
    const projector = sqlite({ path: ':memory:' })
    await projector.init?.()
    await projector.project([
      createEvent('run_1', {
        type: 'runtime.run.started',
        payload: { rootThreadId: 'thr_1', kind: 'agent', definitionName: 'echo', input: null },
        threadId: null,
        origin: { type: 'system' },
      }),
    ])
    const row = await projector.getActor('run_1')
    expect(row?.definitionName).toBe('echo')
    await projector.dispose?.()
  })
})
