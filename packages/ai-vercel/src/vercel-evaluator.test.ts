import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import {
  toEvaluatorAnswers,
  vercelEvaluator,
  type EvaluationModelProvider,
} from './vercel-evaluator'

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

function fakeProvider(requested: string[]): EvaluationModelProvider {
  return {
    evaluationModel: (modelId) => ({
      specificationVersion: 'v4',
      provider: 'fake',
      modelId,
      supportedQuestionTypes: ['boolean', 'choice', 'score'],
      doEvaluate: () => {
        requested.push(modelId)

        return Promise.resolve({
          answers: {
            needsReview: { type: 'boolean', probability: 0.9 },
            urgency: { type: 'choice', choice: 'high' },
            risk: { type: 'score', score: 2 },
          },
          usage: { inputTokens: 12, outputTokens: 3 },
          warnings: [],
        })
      },
    }),
  }
}

describe('vercelEvaluator', () => {
  test('the installed ai package exports experimental_evaluate', async () => {
    const mod = await import('ai')

    expect(Predicate.isFunction(mod.experimental_evaluate)).toBe(true)
  })

  test('resolves model ids through a provider, preferring the definition model', async () => {
    const requested: string[] = []

    const adapter = vercelEvaluator({
      provider: fakeProvider(requested),
      model: 'jev-latest',
    })

    const result = await adapter.evaluate({ state: 'refund', questions })
    await adapter.evaluate({ model: 'jev-next', state: 'refund', questions })

    expect(requested).toEqual(['jev-latest', 'jev-next'])
    expect(result.answers.needsReview).toEqual({ type: 'boolean', value: true, probability: 0.9 })
    expect(result.usage).toEqual({ input: 12, output: 3 })
  })
})
