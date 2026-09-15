import { describe, expect, test } from 'bun:test'

import { createEvent, type JsonValue } from '@looms/core'

import { projectRunView } from './project-run'

const runId = 'run_project'
const checkout = 'thr_checkout'
const assistant = 'thr_assistant'

function event(
  seq: number,
  type: string,
  payload: JsonValue,
  extras: { threadId?: string | null; parentThreadId?: string | null } = {},
) {
  return createEvent(
    runId,
    {
      type,
      payload,
      threadId: extras.threadId ?? null,
      parentThreadId: extras.parentThreadId,
      id: `evt_${seq}`,
      ts: 1_000 + seq,
    },
    { seq },
  )
}

const prefix = [
  event(1, 'runtime.run.started', {
    rootThreadId: checkout,
    kind: 'workflow',
    definitionName: 'checkout',
    input: { amount: 42 },
  }),
  event(
    2,
    'runtime.thread.started',
    {
      threadId: checkout,
      kind: 'workflow',
      definitionName: 'checkout',
      input: { amount: 42 },
      parentThreadId: null,
    },
    { threadId: checkout },
  ),
  event(
    3,
    'workflow.spawn.requested',
    {
      nodeId: 'review',
      childThreadId: assistant,
      kind: 'agent',
      definitionName: 'assistant',
      input: { amount: 42 },
    },
    { threadId: checkout },
  ),
  event(
    4,
    'runtime.thread.started',
    {
      threadId: assistant,
      kind: 'agent',
      definitionName: 'assistant',
      input: { amount: 42 },
      parentThreadId: checkout,
    },
    { threadId: assistant, parentThreadId: checkout },
  ),
]

describe('projectRunView', () => {
  test('grows the tree as events arrive', () => {
    const beforeSpawn = projectRunView(prefix.slice(0, 2))
    expect(beforeSpawn.tree.root?.definitionName).toBe('checkout')
    expect(beforeSpawn.tree.root?.children).toEqual([])
    expect(beforeSpawn.runStatus).toBe('running')

    const afterSpawn = projectRunView(prefix)

    expect(afterSpawn.tree.root?.children.map((child) => child.definitionName)).toEqual([
      'assistant',
    ])

    expect(afterSpawn.eventCounts.get(assistant)).toBe(1)
    expect(afterSpawn.startedAt).toBe(1_001)
  })
})
