import { describe, expect, test } from 'bun:test'
import { verifyDemo } from './verify'

describe('@looms/demo', () => {
  test('verify covers agent, workflow, checkout, subagent', async () => {
    await verifyDemo()
    expect(true).toBe(true)
  })
})
