import { describe, expect, test } from 'bun:test'

import { projectionFor, workspaceFor, type DebuggerPlugin } from './plugin'

const plugins: readonly DebuggerPlugin[] = [
  {
    name: 'agent',
    workspace: { kinds: ['agent', 'agent-session'], component: () => null },
    projections: [
      {
        projection: { name: 'tokenUsage', initialState: null, reduce: (state) => state },
        component: () => null,
      },
    ],
  },
  {
    name: 'workflow',
    workspace: { kinds: ['workflow'], component: () => null },
  },
]

describe('workspaceFor', () => {
  test('matches a definition kind and ignores kinds no plugin claims', () => {
    expect(workspaceFor(plugins, 'agent-session')?.kinds).toEqual(['agent', 'agent-session'])
    expect(workspaceFor(plugins, 'approval')).toBeUndefined()
  })
})

describe('projectionFor', () => {
  test('matches a projection name', () => {
    expect(projectionFor(plugins, 'tokenUsage')?.projection.name).toBe('tokenUsage')
    expect(projectionFor(plugins, 'nodes')).toBeUndefined()
  })
})
