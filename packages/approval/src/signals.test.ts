import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { type WaitEffect } from '@looms/core'

import { gate } from './signals'

describe('@looms/approval signals', () => {
  test('gate returns request + wait', () => {
    const effects = gate({ title: 'OK?' })
    expect(effects[0]?.type).toBe('approval.request')
    expect('tag' in effects[0]! && Predicate.isString(effects[0].tag)).toBe(true)
    expect(effects[1]?.type).toBe('runtime.wait')
  })

  test('gate generates distinct approvalIds and waitIds when omitted', () => {
    const gate1 = gate({ title: 'Gate 1' })
    const gate2 = gate({ title: 'Gate 2' })
    const wait1 = gate1.find((e): e is WaitEffect => e.type === 'runtime.wait')
    const wait2 = gate2.find((e): e is WaitEffect => e.type === 'runtime.wait')
    expect(wait1?.waitId).toBeDefined()
    expect(wait2?.waitId).toBeDefined()
    expect(wait1?.waitId).not.toBe(wait2?.waitId)
  })
})
