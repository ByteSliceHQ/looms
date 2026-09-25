import { describe, expect, test } from 'bun:test'

import { formFields, valuesToInput } from './schema-form'

describe('formFields', () => {
  test('returns form fields for flat object with scalar properties', () => {
    const fields = formFields({
      type: 'object',
      properties: {
        title: { type: 'string', title: 'Task Title', default: 'Hello' },
        count: { type: 'integer', default: 5 },
        active: { type: 'boolean', default: true },
      },
    })

    expect(fields).toEqual([
      { name: 'title', label: 'Task Title', type: 'string', defaultValue: 'Hello' },
      { name: 'count', label: 'count', type: 'number', defaultValue: '5' },
      { name: 'active', label: 'active', type: 'boolean', defaultValue: 'true' },
    ])
  })

  test('returns undefined when property type is missing or complex', () => {
    expect(
      formFields({
        type: 'object',
        properties: {
          items: { type: 'array' },
        },
      }),
    ).toBeUndefined()

    expect(
      formFields({
        type: 'object',
        properties: {
          untyped: {},
        },
      }),
    ).toBeUndefined()

    expect(formFields({ type: 'string' })).toBeUndefined()
  })

  test('converts values to typed input', () => {
    const fields = formFields({
      type: 'object',
      properties: {
        title: { type: 'string' },
        count: { type: 'number' },
        active: { type: 'boolean' },
      },
    })!

    const input = valuesToInput(fields, {
      title: 'Deploy',
      count: '42',
      active: 'true',
    })

    expect(input).toEqual({
      title: 'Deploy',
      count: 42,
      active: true,
    })
  })
})
