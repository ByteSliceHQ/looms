import { z } from 'zod'

import { gate } from '@swirls/looms/approval'
import { isJsonObject, type JsonValue } from '@swirls/looms/core'
import { defineEvaluator } from '@swirls/looms/evaluator'
import { defineWorkflow } from '@swirls/looms/workflow'

export const RefundRequestSchema = z.object({
  amount: z.number().default(40).describe('Refund amount in USD'),
  reason: z
    .string()
    .default('Failed capture, customer opened a dispute')
    .describe('Why the customer wants the money back'),
})

/** Typed questions a small evaluation model answers before anyone spends a reasoning call. */
export const triageRefund = defineEvaluator({
  name: 'triage-refund',
  description:
    'Scores a refund request with typed questions, then routes it to auto-approval or human review',
  input: RefundRequestSchema,
  state: ({ amount, reason }) => `Refund request for ${amount} USD. Customer reason: ${reason}`,
  questions: {
    needsReview: {
      type: 'boolean',
      instructions: 'Should a human review this refund before it is paid?',
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
  skipModel: ({ amount }) => (amount >= 500 ? { route: 'review', reason: 'skipped' } : undefined),
  route: ({ answers }) => {
    const needsReview = answers.needsReview
    const risk = answers.risk
    const probability = needsReview?.type === 'boolean' ? needsReview.probability : null
    const score = risk?.type === 'score' ? risk.value : null

    if (probability === null || score === null) {
      return { route: 'review', reason: 'unavailable' }
    }

    const auto = probability < 0.1 && score <= 1

    return {
      route: auto ? 'auto' : 'review',
      reason: auto || probability >= 0.9 ? 'model' : 'uncertain',
    }
  },
})

const TriageResultSchema = z.object({
  route: z.string(),
  reason: z.enum(['model', 'uncertain', 'skipped', 'unavailable']),
})

function triageRoute(result: JsonValue | undefined): string {
  const parsed = TriageResultSchema.safeParse(result)
  return parsed.success && parsed.data.reason !== 'unavailable' ? parsed.data.route : 'review'
}

function isRejected(result: JsonValue | undefined): boolean {
  return isJsonObject(result) && result.outcome === 'reject'
}

export const refund = defineWorkflow({
  name: 'refund',
  description:
    'Triage a refund with the triage-refund evaluator. Low-risk refunds are approved automatically; the rest wait for a human in the Approvals panel. Report the triage route and the final status.',
  input: RefundRequestSchema,
  nodes: [
    {
      id: 'triage',
      run: (ctx) => ctx.spawn(triageRefund, ctx.input),
    },
    {
      id: 'review',
      deps: ['triage'],
      run: (ctx) => {
        if (triageRoute(ctx.results.triage) === 'auto') {
          return { skipped: true, reason: 'auto-approved' }
        }

        return ctx.effects(gate({ title: `Refund ${ctx.input.amount} USD? ${ctx.input.reason}` }))
      },
    },
  ],
  output: ({ results }) => ({
    status: isRejected(results.review) ? 'rejected' : 'approved',
    route: triageRoute(results.triage),
    triage: results.triage ?? null,
    review: results.review ?? null,
  }),
})
