import { describe, expect, test } from 'bun:test'

import { defineModule, payload } from '@looms/core'

import { debuggerConformance, projectionFor, workspaceFor, type DebuggerPlugin } from './plugin'

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

describe('debuggerConformance', () => {
  const payments = defineModule(
    {
      namespace: 'payments',
      protocolVersion: '1.0.0',
      events: { 'charge.authorized': payload<{ amount: number }>() },
    },
    (m) => ({
      projections: {
        ledger: m.projection({
          name: 'ledger',
          initialState: { entries: [] },
          reduce: (state) => state,
        }),
        audit: m.projection({
          name: 'audit',
          initialState: { notes: [] },
          reduce: (state) => state,
        }),
      },
    }),
  )

  const plugin: DebuggerPlugin = {
    name: 'payments',
    families: [{ family: 'payments', color: 'oklch(0.7 0.1 180)' }],
    projections: [{ name: 'ledger', component: () => null }],
    headlessProjections: ['audit'],
  }

  test('accepts a plugin that covers events and projections', () => {
    expect(debuggerConformance(payments, plugin)).toEqual([])
  })

  test('reports a missing family, a missing projection, and a stale pane', () => {
    expect(
      debuggerConformance(payments, {
        name: 'billing',
        families: [{ family: 'billing', color: 'oklch(0.7 0.1 180)' }],
        projections: [{ name: 'invoices', component: () => null }],
      }),
    ).toEqual([
      'debugger plugin billing does not match module namespace payments',
      'event payments.charge.authorized has no debugger family',
      'debugger pane invoices is not a projection of payments',
      'projection audit has no debugger pane or headlessProjections entry',
      'projection ledger has no debugger pane or headlessProjections entry',
    ])
  })
})
