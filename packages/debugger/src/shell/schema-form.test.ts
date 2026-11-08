import { describe, expect, test } from 'bun:test'

import {
  formFields,
  formInput,
  initialValues,
  inputForm,
  messageInput,
  parseFormInput,
  valuesToInput,
} from './schema-form'

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
      {
        name: 'title',
        label: 'Task Title',
        type: 'string',
        defaultValue: 'Hello',
        required: false,
      },
      { name: 'count', label: 'count', type: 'number', defaultValue: '5', required: false },
      { name: 'active', label: 'active', type: 'boolean', defaultValue: 'true', required: false },
    ])
  })

  test('maps enum and const string properties to select fields', () => {
    expect(
      formFields({
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['fast', 'slow'], default: 'slow' },
          fixed: { const: 'only' },
        },
      }),
    ).toEqual([
      {
        name: 'mode',
        label: 'mode',
        type: 'select',
        defaultValue: 'slow',
        required: false,
        options: ['fast', 'slow'],
      },
      {
        name: 'fixed',
        label: 'fixed',
        type: 'select',
        defaultValue: 'only',
        required: false,
        options: ['only'],
      },
    ])
  })

  test('marks properties listed in required', () => {
    const fields = formFields({
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        note: { type: 'string' },
      },
    })

    expect(fields?.find((field) => field.name === 'title')?.required).toBe(true)
    expect(fields?.find((field) => field.name === 'note')?.required).toBe(false)
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

describe('valuesToInput', () => {
  test('omits optional empty strings and numbers', () => {
    const fields = formFields({
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        note: { type: 'string' },
        count: { type: 'number' },
      },
    })

    expect(fields).toBeDefined()
    expect(valuesToInput(fields!, { title: 'Hi', note: '', count: '' })).toEqual({ title: 'Hi' })
  })
})

describe('parseFormInput', () => {
  test('returns parse errors instead of throwing', () => {
    const result = parseFormInput({ kind: 'json' }, { fields: {}, source: '{' })

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0)
    }
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
