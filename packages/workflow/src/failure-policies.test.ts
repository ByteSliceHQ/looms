import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { defineWorkflow, type NodeState, type WorkflowDefinition } from './definitions'
import { scheduleEvents } from './effects'
import { nodeResults } from './graph'

const failed = (attempts: number): NodeState => ({
  status: 'failed',
  result: null,
  error: 'boom',
  attempts,
})

const pending: NodeState = { status: 'pending', result: null, error: null }

function schedule(definition: WorkflowDefinition, nodes: Record<string, NodeState>) {
  return Effect.runSync(scheduleEvents(definition, { nodes, input: null }, 'thread'))
}

describe('workflow failure policies', () => {
  test('retries up to maxAttempts then fails', () => {
    const definition = defineWorkflow({
      name: 'retry',
      nodes: [{ id: 'task', failure: { type: 'retry', maxAttempts: 3 }, run: () => null }],
    })

    expect(schedule(definition, { task: failed(2) })[0]?.type).toBe('workflow.node.started')
    expect(schedule(definition, { task: failed(3) })[0]?.type).toBe('runtime.thread.failed')
  })

  test('a policy skip still satisfies dependents', () => {
    const definition = defineWorkflow({
      name: 'skip',
      nodes: [
        { id: 'task', failure: { type: 'skip' }, run: () => null },
        { id: 'after', deps: ['task'], run: () => null },
      ],
    })

    expect(schedule(definition, { task: failed(1), after: pending })[0]).toMatchObject({
      type: 'workflow.node.skipped',
      payload: { nodeId: 'task', cause: 'policy' },
    })

    const skipped: NodeState = { ...failed(1), status: 'skipped', skipCause: 'policy' }

    expect(schedule(definition, { task: skipped, after: pending })).toEqual([
      { type: 'workflow.node.started', payload: { nodeId: 'after' }, threadId: 'thread' },
    ])
  })

  test('dependents of a node that fell back wait for and see the fallback result', () => {
    const definition = defineWorkflow({
      name: 'fallback',
      nodes: [
        { id: 'task', failure: { type: 'fallback', nodeId: 'recover' }, run: () => null },
        { id: 'recover', run: () => null },
        { id: 'after', deps: ['task'], run: () => null },
      ],
    })

    expect(
      schedule(definition, { task: failed(1), recover: pending, after: pending }).map(
        (event) => event.type,
      ),
    ).toEqual(['workflow.node.skipped', 'workflow.node.started'])

    const task: NodeState = { ...failed(1), status: 'skipped', skipCause: 'policy' }
    const running: NodeState = { status: 'running', result: null, error: null }

    expect(schedule(definition, { task, recover: running, after: pending })).toEqual([])

    const recovered: NodeState = { status: 'completed', result: 'recovered', error: null }
    const nodes = { task, recover: recovered, after: pending }

    expect(schedule(definition, nodes)[0]).toMatchObject({ payload: { nodeId: 'after' } })
    expect(nodeResults(definition, nodes).task).toBe('recovered')
  })

  test('skips an unused fallback once its primary succeeds', () => {
    const definition = defineWorkflow({
      name: 'fallback-unused',
      nodes: [
        { id: 'task', failure: { type: 'fallback', nodeId: 'recover' }, run: () => null },
        { id: 'recover', run: () => null },
      ],
    })

    const done: NodeState = { status: 'completed', result: 1, error: null }

    expect(schedule(definition, { task: done, recover: pending })[0]).toMatchObject({
      type: 'workflow.node.skipped',
      payload: { nodeId: 'recover', cause: 'inactive' },
    })

    const unused: NodeState = { ...pending, status: 'skipped', skipCause: 'inactive' }

    expect(schedule(definition, { task: done, recover: unused })[0]?.type).toBe(
      'runtime.thread.completed',
    )
  })

  test('fails the thread instead of throwing when the output is too large', () => {
    const definition = defineWorkflow({
      name: 'too-large',
      outputLimitBytes: 4,
      nodes: [{ id: 'task', run: () => null }],
    })

    const done: NodeState = { status: 'completed', result: 'too long', error: null }

    expect(schedule(definition, { task: done })[0]).toMatchObject({
      type: 'runtime.thread.failed',
      payload: { error: expect.stringContaining('Workflow output') },
    })
  })
})
