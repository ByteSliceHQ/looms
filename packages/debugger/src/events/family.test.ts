import { describe, expect, test } from 'bun:test'

import { familyClass, familyFromPrefix } from './family'

describe('familyFromPrefix', () => {
  test('classifies known prefixes', () => {
    expect(familyFromPrefix('agent.message')).toBe('agent')
    expect(familyFromPrefix('workflow.node.started')).toBe('workflow')
    expect(familyFromPrefix('approval.requested')).toBe('approval')
    expect(familyFromPrefix('payments.charge.authorized')).toBe('payments')
    expect(familyFromPrefix('runtime.wait.registered')).toBe('wait')
    expect(familyFromPrefix('runtime.run.started')).toBe('runtime')
    expect(familyFromPrefix('custom.thing')).toBe('runtime')
  })
})

describe('familyClass', () => {
  test('maps families to token classes', () => {
    expect(familyClass('agent')).toBe('bg-family-agent')
    expect(familyClass('unknown')).toBe('bg-family-runtime')
  })
})
