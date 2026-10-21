import { describe, expect, test } from 'bun:test'

import { Cron, Result } from 'effect'

import {
  cron,
  describeSpec,
  every,
  nextFireAt,
  once,
  specRejection,
  DEFAULT_MIN_INTERVAL_MS,
} from './specs'

describe('schedule specs', () => {
  test('steps a fixed interval from its anchor', () => {
    const spec = every(1_000, { anchor: 5_000 })

    expect(nextFireAt(spec, 4_999)).toBe(5_000)
    expect(nextFireAt(spec, 5_000)).toBe(6_000)
    expect(nextFireAt(spec, 5_001)).toBe(6_000)
    expect(describeSpec(spec)).toBe('every 1s')
  })

  test('fires once only when the instant is still ahead', () => {
    expect(nextFireAt(once(50), 49)).toBe(50)
    expect(nextFireAt(once(50), 50)).toBeNull()
    expect(specRejection(once(50), DEFAULT_MIN_INTERVAL_MS)).toBeUndefined()
  })

  test('allows a one-minute cron and rejects a one-second cron', () => {
    const minute = cron('* * * * *')
    const second = cron('* * * * * *')

    expect(specRejection(minute, DEFAULT_MIN_INTERVAL_MS)).toBeUndefined()
    expect(specRejection(second, DEFAULT_MIN_INTERVAL_MS)).toContain('below the minimum')

    expect(nextFireAt(minute, Date.parse('2026-01-15T00:00:30Z'))).toBe(
      Date.parse('2026-01-15T00:01:00Z'),
    )
  })

  test('skips the missing hour across a daylight-saving change', () => {
    const spec = cron('0 2 * * *', { tz: 'Europe/Paris' })
    const before = Date.parse('2026-03-28T01:00:00Z')
    const next = nextFireAt(spec, before)
    const parsed = Cron.parse(spec.expr, 'Europe/Paris')

    expect(Result.isSuccess(parsed)).toBe(true)

    if (Result.isFailure(parsed) || next === null) {
      throw new Error('expected a cron occurrence')
    }

    expect(next).toBe(Cron.next(parsed.success, before).getTime())
    expect(next - before).toBeGreaterThan(60_000)
    expect(describeSpec(spec)).toBe('0 2 * * * (Europe/Paris)')
  })

  test('rejects an unparseable cron expression', () => {
    expect(specRejection(cron('not a cron'), DEFAULT_MIN_INTERVAL_MS)).toContain('invalid cron')
    expect(nextFireAt(cron('not a cron'), 0)).toBeNull()
  })
})
