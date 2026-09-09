import { describe, expect, test } from 'bun:test'
import { createEvent, project } from '@looms/core'
import { nodes, NodesProjectionSchema } from './projections'

function assignSeq<T extends { seq: number }>(events: T[]): T[] {
  return events.map((e, idx) => ({ ...e, seq: idx + 1 }))
}

describe('workflow projections with Effect schemas', () => {
  test('nodes projection attaches NodesProjectionSchema as shape', () => {
    expect(nodes.shape).toBe(NodesProjectionSchema)
    expect(nodes.initialState).toEqual({ nodes: {} })

    const events = assignSeq([
      createEvent('run_wf_1', {
        type: 'workflow.node.started',
        payload: { nodeId: 'step_1' },
      }),
      createEvent('run_wf_1', {
        type: 'workflow.node.finished',
        payload: { nodeId: 'step_1', result: { done: true } },
      }),
      createEvent('run_wf_1', {
        type: 'workflow.node.started',
        payload: { nodeId: 'step_2' },
      }),
      createEvent('run_wf_1', {
        type: 'workflow.node.finished',
        payload: { nodeId: 'step_2', error: 'boom' },
      }),
      createEvent('run_wf_1', {
        type: 'workflow.node.skipped',
        payload: { nodeId: 'step_3' },
      }),
    ])

    const result = project(nodes, events)
    expect(result.nodes.step_1).toEqual({
      status: 'completed',
      result: { done: true },
      error: null,
    })
    expect(result.nodes.step_2).toEqual({
      status: 'failed',
      result: null,
      error: 'boom',
    })
    expect(result.nodes.step_3).toEqual({
      status: 'skipped',
      result: null,
      error: null,
    })
  })
})
