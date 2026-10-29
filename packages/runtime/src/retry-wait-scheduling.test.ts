import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { defineEffect, defineRuntimeModule, invoke, type RunState } from '@looms/core'
import { defineWorkflow, workflow, type WorkflowDefinition } from '@looms/workflow'

import { createLooms } from './looms'

async function waitFor(predicate: () => Promise<boolean> | boolean, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs

  while (!(await predicate()) && Date.now() < deadline) {
    await Bun.sleep(10)
  }
}

/** An effect that never succeeds but keeps earning retries with a long backoff. */
function flakyModule() {
  let attempts = 0

  const flaky = defineEffect.local({
    type: 'flaky.call',
    retry: { maxAttempts: 5, backoffMs: 500 },
    execute: () => {
      attempts += 1
      return Effect.fail(new Error('upstream 503'))
    },
  })

  const module = defineRuntimeModule({
    namespace: 'flaky',
    protocolVersion: '1.0.0',
    effects: { call: flaky },
  })

  return { module, attempts: () => attempts }
}

function retryWaitExecution(state: RunState) {
  return Object.values(state.effectExecutions).find((item) => item.status === 'retry_wait')
}

async function startParked(definition: WorkflowDefinition) {
  const { module, attempts } = flakyModule()

  const looms = createLooms({
    modules: [workflow({ definitions: [definition] }), module],
    maxWakeIterations: 20,
  })

  const { runId, state } = await looms.start(definition, {})
  const events = await looms.getEvents(runId)
  await looms.stop()

  return { state, events, attempts: attempts() }
}

describe('wake loop while a workflow node waits to retry', () => {
  test('a sibling node finishing while another waits to retry parks the run', async () => {
    const definition = defineWorkflow({
      name: 'parallel-retry-wait',
      nodes: [
        { id: 'call', run: (ctx) => ctx.effects([invoke('flaky.call', {})]) },
        { id: 'skipped', run: () => 'done' },
      ],
    })

    const { state, events, attempts } = await startParked(definition)

    expect(state.status).toBe('running')
    expect(attempts).toBe(1)
    expect(retryWaitExecution(state)?.nextAttemptAt ?? 0).toBeGreaterThan(Date.now())
    expect(events.filter((e) => e.type === 'runtime.effect.retry.scheduled')).toHaveLength(1)
    expect(events.some((e) => e.type === 'workflow.node.finished')).toBe(true)
    expect(events.filter((e) => e.type === 'runtime.effect.failed')).toHaveLength(0)
  })

  test('a node skipped by policy while a sibling waits to retry parks the run', async () => {
    const definition = defineWorkflow({
      name: 'parallel-retry-wait-skip',
      nodes: [
        { id: 'call', run: (ctx) => ctx.effects([invoke('flaky.call', {})]) },
        {
          id: 'optional',
          failure: { type: 'skip' },
          run: () => {
            throw new Error('permanent')
          },
        },
      ],
    })

    const { state, events, attempts } = await startParked(definition)

    expect(state.status).toBe('running')
    expect(attempts).toBe(1)
    expect(retryWaitExecution(state)).toBeDefined()
    expect(events.some((e) => e.type === 'workflow.node.skipped')).toBe(true)
  })

  test('a dependent node registering waits after its dependency completed at start parks the run', async () => {
    const definition = defineWorkflow({
      name: 'chain-retry-wait',
      nodes: [
        { id: 'first', run: () => 'preset' },
        { id: 'second', deps: ['first'], run: (ctx) => ctx.effects([invoke('flaky.call', {})]) },
      ],
    })

    const { state, attempts } = await startParked(definition)

    expect(state.status).toBe('running')
    expect(attempts).toBe(1)
    expect(retryWaitExecution(state)).toBeDefined()
  })

  test('a sibling node finishing while another sleeps parks the run until the timer', async () => {
    const definition = defineWorkflow({
      name: 'parallel-sleep',
      nodes: [
        { id: 'slow', run: (ctx) => ctx.sleep(30) },
        { id: 'fast', run: () => 'done' },
      ],
      output: ({ results }) => results.fast ?? null,
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [definition] })],
      maxWakeIterations: 20,
    })

    const { runId, state } = await looms.start(definition, {})
    expect(state.status).toBe('running')

    await waitFor(async () => (await looms.getRun(runId)).status !== 'running')
    const finished = await looms.getRun(runId)
    await looms.stop()

    expect(finished.status).toBe('completed')
  })

  test('the retried effect runs again after the backoff and the workflow settles', async () => {
    let attempts = 0

    const recovering = defineEffect.local({
      type: 'recovering.call',
      retry: { maxAttempts: 3, backoffMs: 20 },
      execute: () => {
        attempts += 1

        return attempts < 2
          ? Effect.fail(new Error('upstream 503'))
          : Effect.succeed([{ type: 'recovering.called', payload: { attempts } }])
      },
    })

    const definition = defineWorkflow({
      name: 'parallel-recovering',
      nodes: [
        { id: 'call', run: (ctx) => ctx.effects([invoke('recovering.call', {})]) },
        { id: 'fast', run: () => 'done' },
      ],
    })

    const looms = createLooms({
      modules: [
        workflow({ definitions: [definition] }),
        defineRuntimeModule({
          namespace: 'recovering',
          protocolVersion: '1.0.0',
          effects: { call: recovering },
        }),
      ],
      maxWakeIterations: 20,
    })

    const { runId, state } = await looms.start(definition, {})
    expect(state.status).toBe('running')

    await waitFor(() => attempts >= 2)
    const events = await looms.getEvents(runId)
    await looms.stop()

    expect(attempts).toBe(2)
    expect(events.filter((e) => e.type === 'runtime.effect.retry.scheduled')).toHaveLength(1)
    expect(events.some((e) => e.type === 'recovering.called')).toBe(true)
  })
})
