import { describe, expect, test } from 'bun:test'

import { composeModules } from '@looms/core'

import { approval } from './module'

describe('@looms/approval module', () => {
  test('composes and exposes request handler', () => {
    const registry = composeModules([approval()])
    expect(registry.effects.get('approval.request')).toBeDefined()
  })
})
