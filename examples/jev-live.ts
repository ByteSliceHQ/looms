import { vercelJev } from '@swirls/looms/ai-vercel'
import { defineJev, evaluations, jev } from '@swirls/looms/jev'
import { createLooms } from '@swirls/looms/runtime'

// Hosted TypeSafe Jev through vercelJev(). Needs AI_GATEWAY_API_KEY.
// bun run --filter @looms/examples jev-live

if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
  throw new Error('Set AI_GATEWAY_API_KEY in the environment; do not pass it on the command line.')
}

const scoreRefund = defineJev({
  name: 'score-refund',
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
  route: ({ answers }) => {
    const needs = answers.needsReview
    const probability = needs?.type === 'boolean' ? needs.probability : null
    const auto = probability !== null && probability < 0.1

    return {
      route: auto ? 'auto' : 'review',
      reason: probability !== null && (auto || probability >= 0.9) ? 'model' : 'uncertain',
    }
  },
})

const samples = [
  { amount: 12, reason: 'duplicate charge, already resolved' },
  { amount: 40, reason: 'failed capture, customer dispute' },
] as const

const looms = createLooms({
  modules: [jev({ definitions: [scoreRefund], evaluator: vercelJev() })],
})

try {
  for (const sample of samples) {
    const { state } = await looms.start(scoreRefund, sample)
    const output = state.rootThreadId ? state.threads[state.rootThreadId]?.output : null

    console.log({ sample: sample.reason, output })
  }

  const last = await looms.start(scoreRefund, samples[0])
  const scored = await looms.project(last.runId, evaluations)

  console.log(
    'evaluations:',
    scored.items.map((item) => `${item.reason}:${item.route}`),
  )
} finally {
  await looms.stop()
}
