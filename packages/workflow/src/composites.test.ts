import { describe, expect, test } from 'bun:test'

import {
  executeFanout,
  executeMap,
  executeWhile,
  type CompositeCheckpoint,
  type CompositeExecutionContext,
} from './composites'

function context(
  run: CompositeExecutionContext['executeChild'],
  checkpoints: CompositeCheckpoint[] = [],
): CompositeExecutionContext {
  return {
    parentThreadId: 'parent',
    nodeId: 'loop',
    executeChild: run,
    saveCheckpoint: (checkpoint) => checkpoints.push(checkpoint),
  }
}

describe('composite workflow execution', () => {
  test('map is ordered, sequential, and resumable', async () => {
    const seen: number[] = []

    const output = await executeMap(
      [0, 1, 2],
      context(async (_id, input, index) => {
        seen.push(index)
        return input
      }),
      { checkpoint: { type: 'map', nextIndex: 1, results: [0], previous: 0 } },
    )

    expect(seen).toEqual([1, 2])
    expect(output).toEqual([0, 1, 2])
  })

  test('fanout bounds concurrency and preserves input order', async () => {
    let active = 0
    let maximum = 0

    const output = await executeFanout(
      [0, 1, 2, 3],
      context(async (_id, input, index) => {
        active++
        maximum = Math.max(maximum, active)
        await Bun.sleep((4 - index) * 2)
        active--
        return input
      }),
      { concurrency: 2 },
    )

    expect(maximum).toBe(2)
    expect(output).toEqual([0, 1, 2, 3])
  })

  test('while checkpoints durable iteration state', async () => {
    const checkpoints: CompositeCheckpoint[] = []

    const output = await executeWhile(
      0,
      context(async (_id, _input, index) => index + 1, checkpoints),
      {
        maxIterations: 5,
        condition: (_value, index) => index < 3,
      },
    )

    expect(output).toEqual({ iterations: 3, lastOutput: 3, state: 3 })
    expect(checkpoints).toHaveLength(3)
  })
})
