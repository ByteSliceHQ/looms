import { z } from 'zod'

import { agent, defineAgent } from '@swirls/looms/agent'
import { defineEvaluator, evaluations, evaluator } from '@swirls/looms/evaluator'
import { createLooms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

// Score with defineEvaluator, branch on route/reason, then maybe spawn an agent.
// The stub stands in for any evaluation model, including TypeSafe Jev.
// bun run --filter @looms/examples evaluator

const RefundInput = z.object({
  amount: z.number(),
  reason: z.string(),
})

const scoreRefund = defineEvaluator({
  name: 'score-refund',
  description: 'Cheap typed questions before an expensive review.',
  input: RefundInput,
  questions: {
    needsReview: {
      type: 'boolean',
      instructions: 'Should a reasoning model or a human review this refund before it ships?',
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
  skipModel: (input) => {
    if (input.amount >= 500) {
      return { route: 'review', reason: 'skipped' }
    }

    return undefined
  },
  route: ({ answers }) => {
    const needs = answers.needsReview
    const risk = answers.risk
    const probability = needs?.type === 'boolean' ? needs.probability : null
    const score = risk?.type === 'score' ? risk.value : null

    if (probability === null || score === null || probability < 0 || probability > 1) {
      return { route: 'review', reason: 'unavailable' }
    }

    const auto = probability < 0.1 && score <= 1
    const confident = auto || probability >= 0.9

    return {
      route: auto ? 'auto' : 'review',
      reason: confident ? 'model' : 'uncertain',
    }
  },
})

const reviewer = defineAgent({
  name: 'refund-reviewer',
  instructions: 'Draft a short refund review.',
  input: RefundInput,
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: `Review refund of ${input.amount}: ${input.reason}` },
    done: true,
    output: { draft: `Review refund of ${input.amount}` },
  }),
})

const refund = defineWorkflow({
  name: 'refund',
  input: RefundInput,
  nodes: [
    {
      id: 'score',
      run: (ctx) => ctx.spawn(scoreRefund, ctx.input),
    },
    {
      id: 'next',
      deps: ['score'],
      run: (ctx) => {
        const scored = z
          .object({
            route: z.string(),
            reason: z.enum(['model', 'uncertain', 'skipped', 'unavailable']),
          })
          .safeParse(ctx.results.score)

        const route = scored.success ? scored.data.route : 'review'
        const reason = scored.success ? scored.data.reason : 'unavailable'

        if (route === 'review' || reason === 'uncertain' || reason === 'unavailable') {
          return ctx.spawn(reviewer, ctx.input)
        }

        return { path: 'auto', paid: true }
      },
    },
  ],
  output: ({ results }) => results.next ?? null,
})

const looms = createLooms({
  modules: [
    evaluator({ definitions: [scoreRefund] }),
    agent({ definitions: [reviewer] }),
    workflow({ definitions: [refund] }),
  ],
})

const routine = await looms.start(refund, {
  amount: 12,
  reason: 'duplicate charge, already resolved',
})

console.log('routine:', {
  status: routine.state.status,
  output: routine.state.rootThreadId
    ? routine.state.threads[routine.state.rootThreadId]?.output
    : null,
})

const dispute = await looms.start(refund, {
  amount: 40,
  reason: 'failed capture, customer dispute',
})

console.log('dispute:', {
  status: dispute.state.status,
  output: dispute.state.rootThreadId
    ? dispute.state.threads[dispute.state.rootThreadId]?.output
    : null,
})

const large = await looms.start(refund, {
  amount: 900,
  reason: 'goodwill credit',
})

console.log('large:', {
  status: large.state.status,
  output: large.state.rootThreadId ? large.state.threads[large.state.rootThreadId]?.output : null,
})

console.log('evaluations:', {
  routine: (await looms.project(routine.runId, evaluations)).items.map(
    (item) => `${item.reason}:${item.route}`,
  ),
  dispute: (await looms.project(dispute.runId, evaluations)).items.map(
    (item) => `${item.reason}:${item.route}`,
  ),
  large: (await looms.project(large.runId, evaluations)).items.map(
    (item) => `${item.reason}:${item.route}`,
  ),
})

await looms.stop()
