import { describe, expect, test } from 'bun:test'

import { createEvent } from '@looms/core'

import { memory } from './memory'

describe('memory projector', () => {
  test('indexes a started run', async () => {
    const projector = memory()
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
    expect(row?.kind).toBe('agent')
    await projector.dispose?.()
  })
})
