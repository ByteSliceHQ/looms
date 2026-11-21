import { describe, expect, test } from 'bun:test'

import {
  anyAttributeTokens,
  attributeTokens,
  attributeTokensOf,
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

  test('puts attribute tokens between `run` and the run id', () => {
    const scope = attributeTokens(['orgId', 'projectId'], { orgId: 'org_1', projectId: 'a.b' })

    expect(scope).toEqual(['org_1', 'a~2Eb'])

    expect(eventSubject('looms', 'run_1', 'runtime.run.started', scope)).toBe(
      'looms.run.org_1.a~2Eb.run_1.runtime.run.started',
    )

    expect(runSubjectFilter('looms', 'run_1', scope)).toBe('looms.run.org_1.a~2Eb.run_1.>')
    expect(runSubjectFilter('looms', 'run_1', anyAttributeTokens(2))).toBe('looms.run.*.*.run_1.>')
  })

  test('gives a missing attribute the empty token', () => {
    expect(attributeTokens(['orgId', 'projectId'], { orgId: 'org_1' })).toEqual(['org_1', '~'])
    expect(attributeTokens(['orgId'], undefined)).toEqual(['~'])
  })

  test('reads attribute tokens back from a subject', () => {
    const subject = 'looms.prod.run.org_1.~.run_1.runtime.run.started'

    expect(attributeTokensOf(subject, 'looms.prod', 2)).toEqual(['org_1', '~'])
    expect(attributeTokensOf(subject, 'looms.prod', 0)).toEqual([])
    expect(attributeTokensOf(subject, 'looms', 2)).toBeUndefined()
    expect(attributeTokensOf('looms.run.org_1.run_1', 'looms', 2)).toBeUndefined()
  })

  test('validates prefixes', () => {
    expect(isValidSubjectPrefix('looms.prod')).toBe(true)
    expect(isValidSubjectPrefix('looms.*')).toBe(false)
    expect(isValidSubjectPrefix('looms.')).toBe(false)
  })
})
