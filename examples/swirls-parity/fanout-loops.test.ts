import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { createLooms } from '@swirls/looms/runtime'
import { defineWorkflow, workflow } from '@swirls/looms/workflow'

import { rootOutput, waitForStatus } from './helpers'

const unit = defineWorkflow({
  name: 'parity-unit',
  nodes: [{ id: 'out', run: (ctx) => ctx.input }],
  output: ({ results }) => results.out ?? null,
})

describe('swirls-parity fanout and loops', () => {
  test('a 64-wide fanout of child runs completes in order', async () => {
    const items = Array.from({ length: 64 }, (_, index) => index)

    const fanout = defineWorkflow({
      name: 'parity-fanout-64',
      childExecution: 'run',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(unit, items, 64) }],
      output: ({ results }) => results.items ?? null,
    })

    const looms = createLooms({ modules: [workflow({ definitions: [unit, fanout] })] })
    const started = await looms.start(fanout, null)
    const state = await waitForStatus(looms, started.runId, 'completed', 30_000)
    const events = await looms.getEvents(started.runId)

    expect(rootOutput(state)).toEqual(items)
    expect(events.filter((event) => event.type === 'runtime.run.launched')).toHaveLength(64)
    expect(events.filter((event) => event.type === 'runtime.child.settled')).toHaveLength(64)

    await looms.stop()
  })

  test('map and while loops over child runs', async () => {
    const mapped = defineWorkflow({
      name: 'parity-mapped',
      childExecution: 'run',
      nodes: [{ id: 'items', run: (ctx) => ctx.map(unit, ['a', 'b', 'c']) }],
      output: ({ results }) => results.items ?? null,
    })

    const looping = defineWorkflow({
      name: 'parity-loop',
      childExecution: 'run',
      nodes: [
        {
          id: 'count',
          run: (ctx) => {
            const previous = ctx.iteration?.previous
            const n = Predicate.isNumber(previous) ? previous : 0

            if (n >= 3) {
              return n
            }

            return ctx.loop(unit, n + 1, { maxIterations: 5 })
          },
        },
      ],
      output: ({ results }) => results.count ?? null,
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [unit, mapped, looping] })],
    })

    const mapRun = await looms.start(mapped, null)
    const mapState = await waitForStatus(looms, mapRun.runId, 'completed')
    expect(rootOutput(mapState)).toEqual(['a', 'b', 'c'])

    const loopRun = await looms.start(looping, null)
    const loopState = await waitForStatus(looms, loopRun.runId, 'completed')
    expect(rootOutput(loopState)).toBe(3)

    await looms.stop()
  })
})
