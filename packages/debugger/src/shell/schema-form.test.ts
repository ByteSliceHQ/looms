import { describe, expect, test } from 'bun:test'

import { formFields, formInput, initialValues, inputForm, messageInput } from './schema-form'

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
    expect(formFields({ type: 'object', properties: { items: { type: 'array' } } })).toBeUndefined()
    expect(formFields({ type: 'object', properties: { untyped: {} } })).toBeUndefined()
    expect(formFields({ type: 'string' })).toBeUndefined()
  })
})

describe('inputForm', () => {
  test('picks text, fields, or raw JSON from the schema', () => {
    expect(inputForm({ type: 'string' })).toEqual({ kind: 'text' })
    expect(inputForm({ type: 'object', properties: { n: { type: 'number' } } }).kind).toBe('fields')
    expect(inputForm({ type: 'array' })).toEqual({ kind: 'json' })
    expect(inputForm(undefined)).toEqual({ kind: 'json' })
  })
})

describe('formInput', () => {
  test('converts field values to typed input', () => {
    const form = inputForm({
      type: 'object',
      properties: {
        title: { type: 'string' },
        count: { type: 'number' },
        active: { type: 'boolean' },
      },
    })

    const input = formInput(form, {
      fields: { title: 'Deploy', count: '42', active: 'true' },
      source: '',
    })

    expect(input).toEqual({ title: 'Deploy', count: 42, active: true })
  })

  test('reads text as is and parses JSON source', () => {
    expect(formInput({ kind: 'text' }, { fields: {}, source: 'hello' })).toBe('hello')
    expect(formInput({ kind: 'json' }, initialValues({ kind: 'json' }))).toEqual({})
    expect(() => formInput({ kind: 'json' }, { fields: {}, source: '{' })).toThrow()
  })
})

describe('messageInput', () => {
  test('puts the message in a text input or the only string field', () => {
    expect(messageInput({ kind: 'text' }, 'hello')).toBe('hello')

    expect(
      messageInput(
        inputForm({
          type: 'object',
          properties: { task: { type: 'string' }, depth: { type: 'number', default: 2 } },
        }),
        'hello',
      ),
    ).toEqual({ task: 'hello', depth: 2 })
  })

  test('declines forms without exactly one string field', () => {
    const twoStrings = inputForm({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
    })

    expect(messageInput(twoStrings, 'hello')).toBeUndefined()
    expect(messageInput({ kind: 'json' }, 'hello')).toBeUndefined()
  })
})
