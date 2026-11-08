import { describe, expect, test } from 'bun:test'

import { agent } from '@looms/agent'
import { approval } from '@looms/approval'
import { evaluator } from '@looms/evaluator'
import { workflow } from '@looms/workflow'

import { moduleConformance } from './index'

describe('built-in module conformance', () => {
  test('agent', () => {
    expect(moduleConformance(agent())).toEqual([])
  })

  test('approval', () => {
    expect(moduleConformance(approval())).toEqual([])
  })

  test('evaluator', () => {
    expect(moduleConformance(evaluator())).toEqual([])
  })

  test('workflow', () => {
    expect(moduleConformance(workflow())).toEqual([])
  })
})
