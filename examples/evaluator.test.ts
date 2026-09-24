import { expect, test } from 'bun:test'

import { z } from 'zod'

import { vercelEvaluator } from '@swirls/looms/ai-vercel'
import { defineEvaluator, evaluator } from '@swirls/looms/evaluator'
import { createLooms } from '@swirls/looms/runtime'

const EvaluatorOutput = z.object({
  route: z.string(),
  reason: z.enum(['model', 'uncertain', 'skipped', 'unavailable']),
})

function outputOf(state: {
  rootThreadId: string | null
  threads: { [id: string]: { output?: unknown } | undefined }
}) {
  const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined
  return EvaluatorOutput.parse(root?.output)
}

const key = process.env.AI_GATEWAY_API_KEY?.trim()

test.skipIf(!key)('live evaluator scores refund questions with Jev', async () => {
  const scoreRefund = defineEvaluator({
    name: 'score-refund',
    model: 'typesafe-ai/jev',
    questions: {
      needsReview: {
        type: 'boolean',
        instructions: 'Should this refund be reviewed before it ships?',
      },
      urgency: {
        type: 'choice',
        instructions: 'How urgent is this refund?',
        criteria: {
          high: 'Customer-visible failure or dispute',
          normal: 'Needs a look but is not blocking',
          low: 'Routine, already resolved, or duplicate',
        },
      },
      risk: {
        type: 'score',
        instructions: 'Score the risk of paying this refund incorrectly.',
        criteria: ['None', 'Low', 'Moderate', 'High', 'Severe'],
      },
    },
    route: ({ answers }) => {
      const needs = answers.needsReview
      const probability = needs?.type === 'boolean' ? needs.probability : null

      return {
        route: probability !== null && probability < 0.1 ? 'auto' : 'review',
        reason:
          probability !== null && (probability < 0.1 || probability >= 0.9) ? 'model' : 'uncertain',
      }
    },
  })

  const looms = createLooms({
    modules: [
      evaluator({
        definitions: [scoreRefund],
        evaluator: vercelEvaluator({ model: 'typesafe-ai/jev' }),
      }),
    ],
  })

  try {
    const result = await looms.start(scoreRefund, {
      amount: 12,
      reason: 'duplicate charge, already resolved',
    })

    const output = outputOf(result.state)

    expect(['model', 'uncertain']).toContain(output.reason)
    expect(['auto', 'review']).toContain(output.route)
  } finally {
    await looms.stop()
  }
})
