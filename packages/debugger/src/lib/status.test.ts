import { describe, expect, test } from 'bun:test'

import { statusClass, statusDotClass } from './status'

describe('statusClass', () => {
  test('maps known statuses', () => {
    expect(statusClass('running')).toBe('text-status-running')
    expect(statusClass('approved')).toBe('text-status-completed')
    expect(statusClass('declined')).toBe('text-status-failed')
    expect(statusClass('other')).toBe('text-status-cancelled')
  })
})

describe('statusDotClass', () => {
  test('includes pulse for running', () => {
    expect(statusDotClass('running')).toContain('bg-status-running')
    expect(statusDotClass('running')).toContain('animate-pulse')
    expect(statusDotClass('completed')).toContain('bg-status-completed')
  })
})
