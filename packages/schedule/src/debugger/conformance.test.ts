import { describe, expect, test } from 'bun:test'

import { debuggerConformance } from '@looms/debugger'

import { schedule } from '../module'
import { scheduleDebugger } from './index'

describe('schedule debugger', () => {
  test('covers the schedule module', () => {
    expect(debuggerConformance(schedule(), scheduleDebugger)).toEqual([])
  })
})
