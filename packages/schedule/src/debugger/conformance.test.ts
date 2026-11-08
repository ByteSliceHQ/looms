import { describe, expect, test } from 'bun:test'

import { debuggerConformance } from '@looms/debugger'
import { moduleConformance } from '@looms/testing'

import { schedule } from '../module'
import { scheduleDebugger } from './index'

describe('schedule debugger', () => {
  test('covers the schedule module', () => {
    expect(debuggerConformance(schedule(), scheduleDebugger)).toEqual([])
  })

  test('passes module conformance', () => {
    expect(moduleConformance(schedule())).toEqual([])
  })
})
