import { describe, expect, test } from 'bun:test'

import { defineEventCatalog, defineRuntimeModule, payload } from '@looms/core'

import { assertReplayDeterministic, createTestRuntime, moduleConformance } from './index'

const sample = defineRuntimeModule({
  namespace: 'sample',
  protocolVersion: '1.0.0',
  events: defineEventCatalog('sample', {
    ping: payload<{ n: number }>(),
  }),
})

describe('moduleConformance', () => {
  test('valid module has no errors', () => {
    expect(moduleConformance(sample)).toEqual([])
  })

  test('flags catalog namespace mismatch', () => {
    const broken = defineRuntimeModule({
      namespace: 'other',
      protocolVersion: '1.0.0',
      events: defineEventCatalog('sample', {
        ping: payload<{ n: number }>(),
      }),
    })

    expect(moduleConformance(broken).some((msg) => msg.includes('catalog namespace'))).toBe(true)
  })
})

describe('createTestRuntime', () => {
  test('folds an empty run deterministically', async () => {
    const testRuntime = await createTestRuntime([sample])
    const runId = 'run_test'
    await assertReplayDeterministic(testRuntime, runId)
    const events = await testRuntime.run(testRuntime.runtime.getEvents(runId))
    expect(events).toEqual([])
  })
})
