import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { defineWorkflow, type NodeState } from './definitions'
import {
  assertJsonWithinLimit,
  getReadyNodeIds,
  getSkippableNodeIds,
  resolveGraphConcurrency,
  topologicalSort,
} from './graph'

const state = (status: NodeState['status'], result: NodeState['result'] = null): NodeState => ({
  status,
  result,
  error: null,
})

describe('production graph planning', () => {
  test('sorts and schedules explicit edges deterministically', () => {
    const definition = defineWorkflow({
      name: 'dag',
      nodes: [
        { id: 'root', run: () => null },
        { id: 'right', run: () => null },
        { id: 'left', run: () => null },
        { id: 'join', run: () => null },
      ],
      edges: [
        { sourceNodeId: 'root', targetNodeId: 'left' },
        { sourceNodeId: 'root', targetNodeId: 'right' },
        { sourceNodeId: 'left', targetNodeId: 'join' },
        { sourceNodeId: 'right', targetNodeId: 'join' },
      ],
    })

    expect(topologicalSort(definition.nodes, definition.edges ?? [])).toEqual([
      'root',
      'right',
      'left',
      'join',
    ])

    expect(getReadyNodeIds(definition, { root: state('completed') })).toEqual(['right', 'left'])
  })

  test('activates selected switch branch and propagates skips', () => {
    const definition = defineWorkflow({
      name: 'switch',
      nodes: [
        { id: 'route', type: 'switch', run: () => ({ type: 'switch', branch: 'left' }) },
        { id: 'left', run: () => null },
        { id: 'right', run: () => null },
        { id: 'after-right', run: () => null },
      ],
      edges: [
        { sourceNodeId: 'route', targetNodeId: 'left', label: 'left' },
        { sourceNodeId: 'route', targetNodeId: 'right', label: 'right' },
        { sourceNodeId: 'right', targetNodeId: 'after-right' },
      ],
    })

    const states = {
      route: { ...state('completed', 'left'), branch: 'left' },
      left: state('pending'),
      right: state('pending'),
      'after-right': state('pending'),
    }

    expect(getReadyNodeIds(definition, states)).toEqual(['left'])
    expect(getSkippableNodeIds(definition, states)).toEqual(['right'])
    states.right = state('skipped')
    expect(getSkippableNodeIds(definition, states)).toEqual(['after-right'])
  })

  test('validates concurrency, cycles, deterministic IDs, and UTF-8 bytes', () => {
    expect(resolveGraphConcurrency(64)).toBe(64)
    expect(() => resolveGraphConcurrency(0)).toThrow('between 1 and 64')

    expect(Effect.runSync(Effect.flip(assertJsonWithinLimit('é', 'value', 3))).message).toContain(
      'UTF-8 bytes',
    )

    expect(() =>
      topologicalSort(
        [{ id: 'a' }, { id: 'b' }],
        [
          { sourceNodeId: 'a', targetNodeId: 'b' },
          { sourceNodeId: 'b', targetNodeId: 'a' },
        ],
      ),
    ).toThrow('cycle')
  })
})
