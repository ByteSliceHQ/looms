import { describe, expect, test } from 'bun:test'

import { debuggerConformance } from '@looms/debugger'
import { moduleConformance } from '@looms/testing'

import { createMemoryBoard } from '../memory-board'
import { swarm } from '../module'
import { createSwarmDebugger, swarmDebugger } from './index'

describe('swarm debugger', () => {
  test('covers the swarm module', () => {
    expect(debuggerConformance(swarm(), swarmDebugger)).toEqual([])
  })

  test('covers the swarm module with a live board', () => {
    const board = createMemoryBoard()

    expect(debuggerConformance(swarm(), createSwarmDebugger({ board: () => board }))).toEqual([])
  })

  test('passes module conformance', () => {
    expect(moduleConformance(swarm())).toEqual([])
  })
})
