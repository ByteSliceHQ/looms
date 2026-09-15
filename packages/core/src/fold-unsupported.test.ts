import { describe, expect, test } from 'bun:test'

import { composeModules } from './compose'
import { createEvent } from './envelope'
import { foldRun } from './fold'

function assignSeq<T extends { seq: number }>(events: T[]): T[] {
  return events.map((event, index) => ({ ...event, seq: index + 1 }))
}

describe('foldRun unsupported thread kind', () => {
  test('fails threads with unsupported kinds instead of inventing empty state', () => {
    const registry = composeModules([])
    const runId = 'run_unknown_kind'
    const threadId = 'thr_unknown'

    const events = assignSeq([
      createEvent(runId, {
        type: 'runtime.run.started',
        payload: {
          rootThreadId: threadId,
          kind: 'workflow',
          definitionName: 'checkout',
          input: null,
        },
        threadId: null,
        origin: { type: 'system' },
      }),
      createEvent(runId, {
        type: 'runtime.thread.started',
        payload: {
          threadId,
          kind: 'workflow',
          definitionName: 'checkout',
          input: { amount: 40 },
          parentThreadId: null,
        },
        threadId,
        origin: { type: 'system' },
      }),
    ])

    const state = foldRun(events, registry)
    expect(state.threads[threadId]?.status).toBe('failed')
    expect(state.threads[threadId]?.error).toBe('Unsupported thread kind: workflow')
    expect(state.threads[threadId]?.state).toEqual({})
    expect(state.outstandingEffects).toHaveLength(0)
  })
})
