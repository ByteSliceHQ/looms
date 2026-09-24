import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { RunStateSchema } from './state'

describe('RunStateSchema', () => {
  test('defaults definition versions in old snapshots to v1', () => {
    const state = Schema.decodeSync(RunStateSchema)({
      runId: 'run_old',
      status: 'running',
      rootThreadId: 'thread_old',
      threads: {
        thread_old: {
          threadId: 'thread_old',
          kind: 'workflow',
          definitionName: 'legacy',
          parentThreadId: null,
          status: 'running',
          input: null,
          output: null,
          error: null,
          state: {},
        },
      },
      waits: {},
      outstandingEffects: [],
    })

    expect(state.threads.thread_old?.definitionVersion).toBe('v1')
    expect(state.effectExecutions).toEqual({})
    expect(state.completedEffectIds).toEqual([])
    expect(state.processedIdempotencyKeys).toEqual([])
    expect(state.startIdentity).toBeNull()
  })
})
