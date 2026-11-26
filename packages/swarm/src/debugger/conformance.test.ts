import { describe, expect, test } from 'bun:test'

import { debuggerConformance } from '@looms/debugger'
import { moduleConformance } from '@looms/testing'

import { swarm } from '../module'
import { swarmDebugger } from './index'

describe('swarm debugger', () => {
  test('covers the swarm module', () => {
    expect(debuggerConformance(swarm(), swarmDebugger)).toEqual([])
  })

  test('passes module conformance', () => {
    expect(moduleConformance(swarm())).toEqual([])
  })
})
