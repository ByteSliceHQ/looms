import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import type { RunState } from '@looms/core'
import { defineWorkflow, workflow, type WorkflowDefinition } from '@looms/workflow'

import { createLooms } from './looms'

function rootOutput(state: RunState) {
  return state.rootThreadId ? state.threads[state.rootThreadId]?.output : undefined
}

async function run(definitions: WorkflowDefinition[], root: WorkflowDefinition) {
  const looms = createLooms({ modules: [workflow({ definitions })] })
  const { state } = await looms.start(root, {})
  await looms.stop()
  return state
}

const double = defineWorkflow({
  name: 'double',
  nodes: [{ id: 'out', run: (ctx) => (Predicate.isNumber(ctx.input) ? ctx.input * 2 : null) }],
  output: ({ results }) => results.out ?? null,
})

describe('workflow graphs on the runtime', () => {
  test('a retried node runs again with a fresh attempt', async () => {
    let calls = 0

    const flaky = defineWorkflow({
      name: 'flaky',
      nodes: [
        {
          id: 'task',
          failure: { type: 'retry', maxAttempts: 3 },
          run: () => {
            calls++

            if (calls < 3) {
              throw new Error(`attempt ${calls} failed`)
            }

            return 'ok'
          },
        },
      ],
    })

    const state = await run([flaky], flaky)

    expect(state.status).toBe('completed')
    expect(calls).toBe(3)
    expect(rootOutput(state)).toEqual({ task: 'ok' })
  })

  test('dependents see the fallback result when a node falls back', async () => {
    const recovering = defineWorkflow({
      name: 'recovering',
      nodes: [
        {
          id: 'primary',
          failure: { type: 'fallback', nodeId: 'backup' },
          run: () => {
            throw new Error('primary down')
          },
        },
        { id: 'backup', run: () => 'from-backup' },
        { id: 'after', deps: ['primary'], run: (ctx) => ctx.results.primary ?? null },
      ],
      output: ({ results }) => results.after ?? null,
    })

    const state = await run([recovering], recovering)

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toBe('from-backup')
  })

  test('a fallback that is not needed is skipped and the run completes', async () => {
    const healthy = defineWorkflow({
      name: 'healthy',
      nodes: [
        { id: 'primary', failure: { type: 'fallback', nodeId: 'backup' }, run: () => 'ok' },
        { id: 'backup', run: () => 'from-backup' },
      ],
      output: ({ results }) => results.primary ?? null,
    })

    const state = await run([healthy], healthy)

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toBe('ok')
  })

  test('map runs child workflows in order and collects their outputs', async () => {
    const mapper = defineWorkflow({
      name: 'mapper',
      nodes: [{ id: 'items', run: (ctx) => ctx.map(double, [1, 2, 3]) }],
      output: ({ results }) => results.items ?? null,
    })

    const state = await run([double, mapper], mapper)

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toEqual([2, 4, 6])
  })

  test('fanout bounds concurrent children and keeps input order', async () => {
    const fanned = defineWorkflow({
      name: 'fanned',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(double, [1, 2, 3, 4, 5], 2) }],
      output: ({ results }) => results.items ?? null,
    })

    const looms = createLooms({ modules: [workflow({ definitions: [double, fanned] })] })
    const { runId, state } = await looms.start(fanned, {})
    const events = await looms.getEvents(runId)
    await looms.stop()

    const children = new Set(
      Object.values(state.threads)
        .filter((thread) => thread.definitionName === 'double')
        .map((thread) => thread.threadId),
    )

    let active = 0
    let peak = 0

    for (const event of events) {
      if (event.threadId === null || !children.has(event.threadId)) {
        continue
      }

      if (event.type === 'runtime.thread.started') {
        peak = Math.max(peak, ++active)
      } else if (event.type === 'runtime.thread.completed') {
        active--
      }
    }

    expect(state.status).toBe('completed')
    expect(children.size).toBe(5)
    expect(peak).toBe(2)
    expect(rootOutput(state)).toEqual([2, 4, 6, 8, 10])
  })

  test('loop re-runs the node with each iteration until it returns a value', async () => {
    const looping = defineWorkflow({
      name: 'looping',
      nodes: [
        {
          id: 'grow',
          run: (ctx) => {
            const current = Predicate.isNumber(ctx.iteration?.previous) ? ctx.iteration.previous : 1
            return current >= 8 ? current : ctx.loop(double, current, { maxIterations: 10 })
          },
        },
      ],
      output: ({ results }) => results.grow ?? null,
    })

    const state = await run([double, looping], looping)

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toBe(8)
  })

  test('loop stops at maxIterations with the last iteration output', async () => {
    const bounded = defineWorkflow({
      name: 'bounded',
      nodes: [
        {
          id: 'grow',
          run: (ctx) => {
            const current = Predicate.isNumber(ctx.iteration?.previous) ? ctx.iteration.previous : 1
            return ctx.loop(double, current, { maxIterations: 2 })
          },
        },
      ],
      output: ({ results }) => results.grow ?? null,
    })

    const state = await run([double, bounded], bounded)

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toBe(4)
  })

  test('a failing map child fails the node', async () => {
    const broken = defineWorkflow({
      name: 'broken',
      nodes: [
        {
          id: 'out',
          run: () => {
            throw new Error('child broke')
          },
        },
      ],
    })

    const mapper = defineWorkflow({
      name: 'broken-mapper',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(broken, [1, 2]) }],
    })

    const state = await run([broken, mapper], mapper)

    expect(state.status).toBe('failed')
  })
})
