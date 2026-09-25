import { describe, expect, test } from 'bun:test'

import { projectionFor, workspaceFor, type DebuggerPlugin } from './plugin'

const definition = (kind: string, name: string) => ({ kind, name, version: 'v1' })

const plugins: readonly DebuggerPlugin[] = [
  {
    name: 'agent',
    workspace: { kinds: ['agent', 'agent-session'], component: () => null },
    projections: [{ name: 'tokenUsage', component: () => null }],
  },
  {
    name: 'workflow',
    workspace: {
      kinds: ['workflow'],
      matches: (candidate) => candidate.name === 'checkout',
      component: () => null,
    },
  },
]

describe('workspaceFor', () => {
  test('matches a definition kind and ignores kinds no plugin claims', () => {
    expect(workspaceFor(plugins, definition('agent-session', 'support'))?.kinds).toEqual([
      'agent',
      'agent-session',
    ])

    expect(workspaceFor(plugins, definition('approval', 'review'))).toBeUndefined()
  })

  test('lets a workspace decline definitions of a kind it claims', () => {
    expect(workspaceFor(plugins, definition('workflow', 'checkout'))?.kinds).toEqual(['workflow'])
    expect(workspaceFor(plugins, definition('workflow', 'refund'))).toBeUndefined()
  })
})

describe('projectionFor', () => {
  test('matches a projection name', () => {
    expect(projectionFor(plugins, 'tokenUsage')?.name).toBe('tokenUsage')
    expect(projectionFor(plugins, 'nodes')).toBeUndefined()
  })
})
