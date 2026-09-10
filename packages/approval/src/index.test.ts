import { describe, expect, test } from 'bun:test'

import { composeModules } from '@looms/core'

import { approval, gate } from './index'

describe('@looms/approval', () => {
  test('composes and exposes request handler', () => {
    const registry = composeModules([approval()])
    expect(registry.handlers.get('approval.request')).toBeDefined()
  })

  test('gate returns request + wait', () => {
    const effects = gate({ title: 'OK?' })
    expect(effects[0]?.type).toBe('approval.request')
    expect(effects[1]?.type).toBe('runtime.wait')
  })
})
