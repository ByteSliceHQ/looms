import { describe, expect, test } from 'bun:test'

import { composeModules, createEvent, foldRun, type JsonValue } from '@looms/core'

import { defineWorkflow } from './definitions'
import { workflow } from './module'

describe('@looms/workflow module', () => {
  test('started thread requests schedule', () => {
    const registry = composeModules([workflow()])

    const state = foldRun(
      [
        {
          ...createEvent('run_w', {
            type: 'runtime.thread.started',
            payload: {
              threadId: 'thr_w',
              kind: 'workflow',
              definitionName: 'pipe',
              input: { nodeIds: ['a'] },
              parentThreadId: null,
            },
            threadId: 'thr_w',
            origin: { type: 'system' },
          }),
          seq: 1,
        },
      ],
      registry,
    )

    expect(state.outstandingEffects[0]?.effect.type).toBe('workflow.schedule')
  })

  test('defineWorkflow sets kind', () => {
    const def = defineWorkflow({
      name: 'pipe',
      nodes: [{ id: 'a', run: () => 1 }],
    })

    expect(def.kind).toBe('workflow')
  })

  test('defineWorkflow accepts input schema and types ctx.input', () => {
    const schema = {
      '~standard': {
        version: 1 as const,
        vendor: 'test',
        // SAFETY: test stub cast.
        validate: (raw: JsonValue) => ({ value: raw as { target: string } }),
      },
    }

    const def = defineWorkflow({
      name: 'pipe_shaped',
      input: schema,
      nodes: [
        {
          id: 'step1',
          run: (ctx) => ({ done: ctx.input.target }),
        },
      ],
    })

    expect(def.kind).toBe('workflow')
    expect(def.input).toBe(schema)
  })

  test('effect.failed finishes the running node and fails the thread', () => {
    const registry = composeModules([workflow()])
    const runId = 'run_wf_fail'
    const threadId = 'thr_wf_fail'

    const state = foldRun(
      [
        {
          ...createEvent(runId, {
            type: 'runtime.thread.started',
            payload: {
              threadId,
              kind: 'workflow',
              definitionName: 'pipe',
              input: { nodeIds: ['charge'] },
              parentThreadId: null,
            },
            threadId,
            origin: { type: 'system' },
          }),
          seq: 1,
        },
        {
          ...createEvent(runId, {
            type: 'workflow.node.started',
            payload: { nodeId: 'charge' },
            threadId,
            origin: { type: 'thread', threadId },
          }),
          seq: 2,
        },
        {
          ...createEvent(runId, {
            type: 'runtime.effect.failed',
            payload: {
              effectId: `${threadId}:3:0`,
              error: 'Invalid input: amount: expected number',
            },
            threadId,
            origin: { type: 'system' },
          }),
          seq: 3,
        },
      ],
      registry,
    )

    const threadState = state.threads[threadId]?.state
    expect(JSON.stringify(threadState)).toContain('"status":"failed"')
    const emitted = state.outstandingEffects.find((item) => item.effect.type === 'runtime.emit')
    expect(emitted).toBeDefined()
    expect(JSON.stringify(emitted?.effect)).toContain('workflow.node.finished')
  })
})
