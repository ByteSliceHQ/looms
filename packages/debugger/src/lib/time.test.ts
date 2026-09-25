import { describe, expect, test } from 'bun:test'

import { relativeTime, runCreatedAt } from './time'

describe('runCreatedAt', () => {
  test('decodes the base36 timestamp in a run id', () => {
    const ms = 1_790_000_000_000
    expect(runCreatedAt(`run_${ms.toString(36)}_1_abc`)).toBe(ms)
  })

  test('returns undefined for ids without a timestamp', () => {
    expect(runCreatedAt('run')).toBeUndefined()
    expect(runCreatedAt('run_!!_1')).toBeUndefined()
  })
})

describe('relativeTime', () => {
  const now = 10_000_000

  test('buckets elapsed time', () => {
    expect(relativeTime(now - 5_000, now)).toBe('just now')
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago')
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h ago')
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d ago')
  })
})
