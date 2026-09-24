import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { toEvaluatorAnswers } from './vercel-evaluator'

const questions = {
  needsReview: {
    type: 'boolean' as const,
    instructions: 'Should this be reviewed?',
  },
  urgency: {
    type: 'choice' as const,
    instructions: 'Urgency',
    criteria: { high: 'High', low: 'Low' },
  },
  risk: {
    type: 'score' as const,
    instructions: 'Risk',
    criteria: ['None', 'Low', 'High'],
  },
}

describe('toEvaluatorAnswers', () => {
  test('maps experimental_evaluate boolean, choice, and score fields', () => {
    const answers = toEvaluatorAnswers(questions, {
      needsReview: { type: 'boolean', probability: 0.02 },
      urgency: { type: 'choice', choice: 'low' },
      risk: { type: 'score', score: 0 },
    })

    expect(answers.needsReview).toEqual({ type: 'boolean', value: false, probability: 0.02 })
    expect(answers.urgency).toEqual({ type: 'choice', value: 'low' })
    expect(answers.risk).toEqual({ type: 'score', value: 0 })
  })
})

describe('vercelEvaluator', () => {
  test('the installed ai package exports experimental_evaluate', async () => {
    const mod = await import('ai')

    expect(Predicate.isFunction(mod.experimental_evaluate)).toBe(true)
  })
})
