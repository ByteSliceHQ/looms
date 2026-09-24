import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import type { WaitEffect } from '@looms/core'
import { composeModules, createEvent, foldRun, stringifyJson } from '@looms/core'
import { createLooms } from '@looms/runtime'
import { defineWorkflow, workflow } from '@looms/workflow'

import { defineEvaluator } from './definitions'
import {
  LOG_TRIAGE_MAX_INPUT_CHARS,
  defineLogTriage,
  logTriageState,
  redactCommonSecrets,
  routeLogTriage,
  skipOversizedLog,
} from './log-triage'
import { evaluator } from './module'
import { evaluations } from './projections'
import { evaluate } from './signals'
import type { EvaluatorAnswers, EvaluatorRouteDecision } from './types'

const RefundInput = Schema.Struct({
  amount: Schema.Finite,
  reason: Schema.String,
})

function routeRefund(answers: EvaluatorAnswers): EvaluatorRouteDecision {
  const probability =
    answers.needsReview?.type === 'boolean' && Number.isFinite(answers.needsReview.probability)
      ? answers.needsReview.probability
      : null

  const score =
    answers.risk?.type === 'score' && Number.isFinite(answers.risk.value)
      ? answers.risk.value
      : null

  if (probability === null || score === null || probability < 0 || probability > 1) {
    return { route: 'review', reason: 'unavailable' }
  }

  const auto = probability < 0.1 && score <= 1
  const confident = auto || probability >= 0.9

  return {
    route: auto ? 'auto' : 'review',
    reason: confident ? 'model' : 'uncertain',
  }
}

const scoreRefund = defineEvaluator({
  name: 'score-refund',
  input: RefundInput,
  questions: {
    needsReview: {
      type: 'boolean',
      instructions: 'Should this refund be reviewed?',
    },
    urgency: {
      type: 'choice',
      instructions: 'Urgency',
      criteria: { high: 'Urgent', normal: 'Normal', low: 'Low' },
    },
    risk: {
      type: 'score',
      instructions: 'Risk',
      criteria: ['None', 'Low', 'Moderate', 'High', 'Severe'],
    },
  },
  skipModel: (input) => {
    if (input.amount >= 500) {
      return { route: 'review', reason: 'skipped' }
    }

    return undefined
  },
  route: ({ answers }) => routeRefund(answers),
  state: (input) => stringifyJson(input),
})

describe('@looms/evaluator module', () => {
  test('defineEvaluator sets kind', () => {
    expect(scoreRefund.kind).toBe('evaluator')
    expect(scoreRefund.name).toBe('score-refund')
  })

  test('composes and exposes evaluate handler', () => {
    const registry = composeModules([evaluator({ definitions: [scoreRefund] })])

    expect(registry.effects.get('evaluator.evaluate')).toBeDefined()
    expect(registry.threads.get('evaluator')).toBeDefined()

    expect(
      registry.definitions.some(
        (item) => item.kind === 'evaluator' && item.name === 'score-refund',
      ),
    ).toBe(true)
  })

  test('evaluate returns request + wait', () => {
    const effects = evaluate(scoreRefund, { amount: 12, reason: 'duplicate, already resolved' })

    expect(effects[0]?.type).toBe('evaluator.evaluate')
    expect(effects[1]?.type).toBe('runtime.wait')

    const waitEffect = effects.find((item): item is WaitEffect => item.type === 'runtime.wait')

    expect(waitEffect?.on).toMatchObject({ type: 'evaluator.evaluated' })

    if (waitEffect && 'match' in waitEffect.on) {
      expect(waitEffect.on.match).toHaveProperty('evaluationId')
    }
  })

  test('started thread requests evaluator.evaluate', () => {
    const registry = composeModules([evaluator({ definitions: [scoreRefund] })])
    const runId = 'run_eval'
    const threadId = 'thr_eval'

    const state = foldRun(
      [
        {
          ...createEvent(runId, {
            type: 'runtime.thread.started',
            payload: {
              threadId,
              kind: 'evaluator',
              definitionName: 'score-refund',
              input: { amount: 12, reason: 'duplicate, already resolved' },
              parentThreadId: null,
            },
            threadId,
            origin: { type: 'system' },
          }),
          seq: 1,
        },
      ],
      registry,
    )

    expect(state.outstandingEffects[0]?.effect.type).toBe('evaluator.evaluate')
    expect(state.threads[threadId]?.kind).toBe('evaluator')
  })

  test('stub auto-approves a routine low-risk input', async () => {
    const looms = createLooms({ modules: [evaluator({ definitions: [scoreRefund] })] })

    try {
      const { state } = await looms.start(scoreRefund, {
        amount: 12,
        reason: 'duplicate charge, already resolved',
      })

      expect(state.status).toBe('completed')

      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      const output = Schema.decodeUnknownSync(
        Schema.Struct({
          route: Schema.Literal('auto'),
          reason: Schema.Literal('model'),
        }),
      )(root?.output)

      expect(output.route).toBe('auto')
    } finally {
      await looms.stop()
    }
  })

  test('stub sends a dispute to review', async () => {
    const looms = createLooms({ modules: [evaluator({ definitions: [scoreRefund] })] })

    try {
      const { state } = await looms.start(scoreRefund, {
        amount: 40,
        reason: 'failed capture, customer dispute',
      })

      expect(state.status).toBe('completed')

      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      const output = Schema.decodeUnknownSync(
        Schema.Struct({
          route: Schema.Literal('review'),
          reason: Schema.Literal('model'),
        }),
      )(root?.output)

      expect(output.route).toBe('review')
    } finally {
      await looms.stop()
    }
  })

  test('skipModel parks large amounts on review without calling the stub', async () => {
    const looms = createLooms({ modules: [evaluator({ definitions: [scoreRefund] })] })

    try {
      const { state } = await looms.start(scoreRefund, {
        amount: 900,
        reason: 'goodwill credit',
      })

      expect(state.status).toBe('completed')

      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      const output = Schema.decodeUnknownSync(
        Schema.Struct({
          route: Schema.Literal('review'),
          reason: Schema.Literal('skipped'),
        }),
      )(root?.output)

      expect(output.reason).toBe('skipped')
    } finally {
      await looms.stop()
    }
  })

  test('evaluations projection records route and reason', async () => {
    const looms = createLooms({ modules: [evaluator({ definitions: [scoreRefund] })] })

    try {
      const { runId } = await looms.start(scoreRefund, {
        amount: 12,
        reason: 'duplicate charge, already resolved',
      })

      const scored = await looms.project(runId, evaluations)

      expect(scored.items[0]?.route).toBe('auto')
      expect(scored.items[0]?.reason).toBe('model')
    } finally {
      await looms.stop()
    }
  })

  test('a workflow can spawn an evaluator child and branch on the route', async () => {
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
            const scored = Schema.decodeUnknownSync(
              Schema.Struct({
                route: Schema.String,
                reason: Schema.String,
              }),
            )(ctx.results.score)

            return { path: scored.route, reason: scored.reason }
          },
        },
      ],
      output: ({ results }) => results.next ?? null,
    })

    const looms = createLooms({
      modules: [evaluator({ definitions: [scoreRefund] }), workflow({ definitions: [refund] })],
    })

    try {
      const { state } = await looms.start(refund, {
        amount: 12,
        reason: 'duplicate charge, already resolved',
      })

      expect(state.status).toBe('completed')

      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      expect(root?.output).toEqual({ path: 'auto', reason: 'model' })
    } finally {
      await looms.stop()
    }
  })
})

describe('defineLogTriage helper', () => {
  const logTriage = defineLogTriage()

  test('routeLogTriage keeps uncertain medium-value records on analyze', () => {
    const decision = routeLogTriage({
      actionable: { type: 'boolean', value: true, probability: 0.4 },
      priority: { type: 'choice', value: 'normal' },
      value: { type: 'score', value: 2 },
    })

    expect(decision.route).toBe('analyze')
    expect(decision.reason).toBe('uncertain')
  })

  test('routeLogTriage fails open when answers are unusable', () => {
    const decision = routeLogTriage({
      actionable: { type: 'boolean', value: true, probability: Number.NaN },
      priority: { type: 'choice', value: 'low' },
      value: { type: 'score', value: 0 },
    })

    expect(decision.route).toBe('analyze')
    expect(decision.reason).toBe('unavailable')
  })

  test('redacts secrets in the model state string', () => {
    const state = logTriageState({
      body: 'Authorization: Bearer sk-live-secret password=hunter2 user@example.com',
    })

    expect(state).toContain('[REDACTED]')
    expect(state).toContain('[EMAIL]')
    expect(state).not.toContain('sk-live-secret')
    expect(state).not.toContain('hunter2')
    expect(state).not.toContain('user@example.com')
    expect(redactCommonSecrets('Bearer abc.def')).toBe('Bearer [REDACTED]')
  })

  test('oversized input skips the model', () => {
    const skip = skipOversizedLog({ body: 'x'.repeat(LOG_TRIAGE_MAX_INPUT_CHARS + 1) })

    expect(skip?.reason).toBe('unavailable')
    expect(skip?.route).toBe('analyze')
  })

  test('ERROR records skip the model', async () => {
    const looms = createLooms({ modules: [evaluator({ definitions: [logTriage] })] })

    try {
      const { state } = await looms.start(logTriage, {
        body: 'Payment capture failed after three retries',
        severityText: 'ERROR',
      })

      expect(state.status).toBe('completed')

      const root = state.rootThreadId ? state.threads[state.rootThreadId] : undefined

      const output = Schema.decodeUnknownSync(
        Schema.Struct({
          route: Schema.Literal('analyze'),
          reason: Schema.Literal('skipped'),
        }),
      )(root?.output)

      expect(output.reason).toBe('skipped')
    } finally {
      await looms.stop()
    }
  })
})
