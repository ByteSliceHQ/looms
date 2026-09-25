import { describe, expect, test } from 'bun:test'

import { jsonEntries, jsonNode, jsonPreview, parseStructuredJson } from './json'

describe('jsonNode', () => {
  test('tags each JSON kind', () => {
    expect(jsonNode(null).kind).toBe('null')
    expect(jsonNode('a').kind).toBe('string')
    expect(jsonNode(1).kind).toBe('number')
    expect(jsonNode(false).kind).toBe('boolean')
    expect(jsonNode([1]).kind).toBe('array')
    expect(jsonNode({ a: 1 }).kind).toBe('object')
  })
})

describe('parseStructuredJson', () => {
  test('parses objects and arrays held in strings', () => {
    expect(parseStructuredJson('{"text":"hi"}')).toEqual({ text: 'hi' })
    expect(parseStructuredJson('  [1, 2]')).toEqual([1, 2])
  })

  test('leaves prose, scalars and malformed JSON as text', () => {
    expect(parseStructuredJson('hello')).toBeUndefined()
    expect(parseStructuredJson('42')).toBeUndefined()
    expect(parseStructuredJson('{not json')).toBeUndefined()
  })
})

describe('jsonEntries', () => {
  test('indexes arrays and keeps object keys', () => {
    expect(jsonEntries(jsonNode(['a', 'b']))).toEqual([
      ['0', 'a'],
      ['1', 'b'],
    ])

    expect(jsonEntries(jsonNode({ role: 'tool' }))).toEqual([['role', 'tool']])
    expect(jsonEntries(jsonNode('text'))).toEqual([])
  })
})

describe('jsonPreview', () => {
  test('summarizes children on one line', () => {
    expect(jsonPreview(jsonNode({ role: 'assistant', calls: [1, 2] }))).toBe(
      '{ role: "assistant", calls: [2] }',
    )

    expect(jsonPreview(jsonNode([{ a: 1 }, null]))).toBe('[ {…}, null ]')
    expect(jsonPreview(jsonNode({}))).toBe('{}')
  })

  test('elides entries past the budget', () => {
    expect(jsonPreview(jsonNode({ first: 'x'.repeat(10), second: 'y' }), 20)).toBe(
      '{ first: "xxxxxxxxxx", … }',
    )
  })
})
