import { describe, expect, test } from 'bun:test'

import { chatInput } from './chat-input'

describe('chatInput', () => {
  test('returns string for string schema or undefined schema', () => {
    expect(chatInput(undefined, 'hello')).toBe('hello')
    expect(chatInput({ type: 'string' }, 'hello')).toBe('hello')
  })

  test('maps text to text or message property when present on object schema', () => {
    expect(
      chatInput(
        {
          type: 'object',
          properties: { text: { type: 'string' } },
        },
        'hello',
      ),
    ).toEqual({ text: 'hello' })

    expect(
      chatInput(
        {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        'hello',
      ),
    ).toEqual({ message: 'hello' })
  })

  test('returns string directly when object schema does not match text or message', () => {
    expect(
      chatInput(
        {
          type: 'object',
          properties: { payload: { type: 'object' } },
        },
        'hello',
      ),
    ).toBe('hello')
  })
})
