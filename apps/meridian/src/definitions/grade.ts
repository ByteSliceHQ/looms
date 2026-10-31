import { z } from 'zod'

import { defineEvaluator } from '@swirls/looms/evaluator'

export const GradeInput = z.object({
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number(),
  arrivalPrice: z.number(),
  fillPrice: z.number(),
  slippageBps: z.number(),
})
export type GradeInput = z.infer<typeof GradeInput>

export const gradeFill = defineEvaluator({
  name: 'grade-fill',
  description: 'Scores the slippage of a fill against the price when the order was decided',
  input: GradeInput,
  state: ({ symbol, side, slippageBps }) => {
    const tone = Math.abs(slippageBps) < 5 ? 'routine' : 'normal'
    return `${tone} ${side} fill in ${symbol}. Slippage ${slippageBps} bps against the arrival price.`
  },
  questions: {
    acceptable: {
      type: 'boolean',
      instructions: 'Was the fill price close enough to the arrival price?',
    },
    quality: {
      type: 'choice',
      instructions: 'How good was the execution?',
      criteria: {
        good: 'A few basis points or better',
        fair: 'Noticeable but tradable slippage',
        poor: 'The book moved through the order',
      },
    },
    cost: {
      type: 'score',
      instructions: 'Score the transaction cost.',
      criteria: ['None', 'Low', 'Moderate', 'High', 'Severe'],
    },
  },
  route: ({ answers }) => {
    const cost = answers.cost
    const score = cost?.type === 'score' ? cost.value : null

    if (score === null) {
      return { route: 'ungraded', reason: 'unavailable' }
    }

    const grade = score <= 0 ? 'good' : score <= 2 ? 'fair' : 'poor'
    return { route: grade, reason: 'model' }
  },
})
