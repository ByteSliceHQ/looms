import { afterAll, describe, expect, test } from 'bun:test'

import { decision, pendingApprovals } from '@swirls/looms/approval'
import { evaluations } from '@swirls/looms/evaluator'
import { createLooms } from '@swirls/looms/runtime'

import { assistant } from './definitions'
import { resolveDemoEvaluator } from './demo-config'
import { refund } from './refunds'
import { demoModules } from './runtime'

const looms = createLooms({ modules: demoModules() })

afterAll(() => looms.stop())

describe('refund triage', () => {
  test('approves a routine refund without asking a human', async () => {
    const { runId, state } = await looms.start(refund, {
      amount: 12,
      reason: 'Duplicate charge, already resolved',
    })

    expect(state.status).toBe('completed')

    const scored = await looms.project(runId, evaluations)
    expect(scored.items.map((item) => [item.route, item.reason])).toEqual([['auto', 'model']])

    expect((await looms.project(runId, pendingApprovals)).items).toEqual([])
  })

  test('sends a dispute to human review and finishes after the decision', async () => {
    const { runId, state } = await looms.start(refund, {
      amount: 40,
      reason: 'Failed capture, customer opened a dispute',
    })

    expect(state.threads[state.rootThreadId ?? '']?.status).toBe('waiting')

    const scored = await looms.project(runId, evaluations)
    expect(scored.items.map((item) => [item.route, item.reason])).toEqual([['review', 'model']])

    const pending = await looms.project(runId, pendingApprovals)
    const approvalId = pending.items.find((item) => item.status === 'pending')?.approvalId

    expect(approvalId).toBeDefined()

    const next = await looms.signal(runId, [decision(approvalId ?? '', 'reject')])
    const root = next.threads[next.rootThreadId ?? '']

    expect(next.status).toBe('completed')
    expect(root?.output).toMatchObject({ status: 'rejected', route: 'review' })
  })

  test('runs from the assistant chat as the refund tool', async () => {
    const { runId } = await looms.start(
      assistant,
      'Refund 12 USD, duplicate charge already resolved',
    )

    const scored = await looms.project(runId, evaluations)
    expect(scored.items.map((item) => item.route)).toEqual(['auto'])
  })

  test('lets the assistant call the evaluator directly as a tool', async () => {
    const { runId, state } = await looms.start(
      assistant,
      'Score the risk of this refund: 40 USD, customer opened a dispute',
    )

    const threads = Object.values(state.threads)
    const evaluatorThread = threads.find((thread) => thread.kind === 'evaluator')

    expect(evaluatorThread?.definitionName).toBe('triage-refund')
    expect(evaluatorThread?.parentThreadId).toBe(state.rootThreadId)
    expect(threads.some((thread) => thread.kind === 'workflow')).toBe(false)

    const scored = await looms.project(runId, evaluations)
    expect(scored.items.map((item) => [item.route, item.reason])).toEqual([['review', 'model']])

    expect((await looms.project(runId, pendingApprovals)).items).toEqual([])
  })

  test('skips the model for large refunds', async () => {
    const { runId } = await looms.start(refund, { amount: 900, reason: 'Goodwill credit' })

    const scored = await looms.project(runId, evaluations)
    expect(scored.items.map((item) => [item.route, item.reason])).toEqual([['review', 'skipped']])
  })
})

describe('resolveDemoEvaluator', () => {
  test('uses the stub without a TypeSafe key', () => {
    expect(resolveDemoEvaluator({})).toBeUndefined()
  })

  test('builds an adapter from the caller key', () => {
    expect(resolveDemoEvaluator({ TYPESAFE_AI_API_KEY: 'ts-test' })).toBeDefined()
  })
})
