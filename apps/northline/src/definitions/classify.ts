import { z } from 'zod'

import { defineEvaluator } from '@swirls/looms/evaluator'

export const ClassifyInput = z.object({
  shipmentId: z.string(),
  kind: z.enum(['late', 'damage', 'shortage']),
  hoursLate: z.number(),
  valueUsd: z.number(),
  note: z.string(),
})
export type ClassifyInput = z.infer<typeof ClassifyInput>

/**
 * Cheap typed questions before a booking. Damage and high-value freight skip the model
 * and go straight to a person. Everything else is scored, then routed.
 */
export const classifyException = defineEvaluator({
  name: 'classify-exception',
  description: 'Decides whether an exception can recover on its own or needs a service lead',
  input: ClassifyInput,
  state: ({ kind, valueUsd, hoursLate, note }) =>
    `${kind} exception for ${valueUsd} USD, ${hoursLate} hours late. ${note}`,
  questions: {
    needsReview: {
      type: 'boolean',
      instructions: 'Should a service lead see this before a recovery is booked?',
    },
    severity: {
      type: 'choice',
      instructions: 'How severe is the service failure?',
      criteria: {
        high: 'Damage, a dispute, or a load that cannot wait',
        normal: 'A missed appointment that still needs a look',
        low: 'Routine, already resolved, or a duplicate scan',
      },
    },
    exposure: {
      type: 'score',
      instructions: 'Score the cost of recovering this incorrectly.',
      criteria: ['None', 'Low', 'Moderate', 'High', 'Severe'],
    },
  },
  skipModel: (input) => {
    if (input.kind === 'damage' || input.valueUsd >= 2_500) {
      return { route: 'review', reason: 'skipped' }
    }

    return undefined
  },
  route: ({ answers }) => {
    const needsReview = answers.needsReview
    const exposure = answers.exposure
    const probability = needsReview?.type === 'boolean' ? needsReview.probability : null
    const score = exposure?.type === 'score' ? exposure.value : null

    if (probability === null || score === null || probability < 0 || probability > 1) {
      return { route: 'review', reason: 'unavailable' }
    }

    const auto = probability < 0.1 && score <= 1

    return {
      route: auto ? 'auto' : 'review',
      reason: auto || probability >= 0.9 ? 'model' : 'uncertain',
    }
  },
})
