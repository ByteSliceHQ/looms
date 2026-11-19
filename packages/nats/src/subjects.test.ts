import { describe, expect, test } from 'bun:test'

import {
  encodeEventType,
  encodeSubjectToken,
  eventSubject,
  isValidSubjectPrefix,
  runSubjectFilter,
} from './subjects'

describe('subject encoding', () => {
  test('leaves safe tokens alone', () => {
    expect(encodeSubjectToken('run_01HZX-abc')).toBe('run_01HZX-abc')
  })

  test('escapes characters NATS reserves', () => {
    expect(encodeSubjectToken('a.b')).toBe('a~2Eb')
    expect(encodeSubjectToken('a*b>c d')).toBe('a~2Ab~3Ec~20d')
    expect(encodeSubjectToken('')).toBe('~')
    expect(encodeSubjectToken('é')).toBe('~C3~A9')
  })

  test('never maps two inputs to one token', () => {
    const inputs = ['a.b', 'a~2Eb', 'a_2Eb', '~', '', '~7E', 'a b', 'a~20b']
    const tokens = new Set(inputs.map(encodeSubjectToken))
    expect(tokens.size).toBe(inputs.length)
  })

  test('splits event types into tokens', () => {
    expect(encodeEventType('runtime.run.started')).toBe('runtime.run.started')
    expect(encodeEventType('agent..tool call')).toBe('agent.~.tool~20call')
  })

  test('builds run and event subjects', () => {
    expect(eventSubject('looms', 'run_1', 'runtime.run.started')).toBe(
      'looms.run.run_1.runtime.run.started',
    )

    expect(runSubjectFilter('looms.prod', 'run.1')).toBe('looms.prod.run.run~2E1.>')
  })

  test('validates prefixes', () => {
    expect(isValidSubjectPrefix('looms.prod')).toBe(true)
    expect(isValidSubjectPrefix('looms.*')).toBe(false)
    expect(isValidSubjectPrefix('looms.')).toBe(false)
  })
})
