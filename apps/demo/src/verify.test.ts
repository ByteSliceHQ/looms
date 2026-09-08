import { describe, expect, test } from 'bun:test'
import { verifyDemo } from './verify'

describe('@looms/demo', () => {
  test('verify covers agent, workflow, hitl, subagent', async () => {
    await verifyDemo()
    expect(true).toBe(true)
  })
})
