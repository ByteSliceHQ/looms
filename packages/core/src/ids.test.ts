import { describe, expect, test } from 'bun:test'

import { deterministicThreadId, parseEffectId } from './ids'

describe('deterministicThreadId', () => {
  test('is stable for the same parts and distinct for different parts', () => {
    expect(deterministicThreadId('parent', 'turn', 'm1')).toBe(
      deterministicThreadId('parent', 'turn', 'm1'),
    )

    expect(deterministicThreadId('parent', 'turn', 'm1')).not.toBe(
      deterministicThreadId('parent', 'turn', 'm2'),
    )
  })

  test('is UUID-shaped so it never splits an effect id', () => {
    const id = deterministicThreadId('session:1', 'turn', 'message:with:colons')

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(parseEffectId(`${id}:tag`)).toEqual({ threadId: id, tag: 'tag' })
  })
})
