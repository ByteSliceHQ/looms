import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import type { RunState } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'

const child = defineWorkflow({
  name: 'child-value',
  nodes: [{ id: 'out', run: () => 7 }],
  output: ({ results }) => results.out,
})

const parent = defineWorkflow({
  name: 'parent-value',
  childExecution: 'run',
  nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(child, {}) }],
  output: ({ results }) => results.spawn,
})

const mappedChild = defineWorkflow({
  name: 'mapped-child',
  nodes: [{ id: 'out', run: (ctx) => ctx.input }],
  output: ({ input }) => input,
})

const mappedParent = defineWorkflow({
  name: 'mapped-parent',
  childExecution: 'run',
  nodes: [{ id: 'items', run: (ctx) => ctx.map(mappedChild, [1, 2]) }],
  output: ({ results }) => results.items,
})

const sleepyChild = defineWorkflow({
  name: 'sleepy-child',
  nodes: [{ id: 'nap', run: (ctx) => ctx.sleep(60_000) }],
})

function rootOutput(state: RunState) {
  return state.rootThreadId ? state.threads[state.rootThreadId]?.output : undefined
}

async function waitForStatus(
  looms: { getRun(runId: string): Promise<RunState> },
  runId: string,
  status: RunState['status'],
) {
  const deadline = Date.now() + 2_000
  let state = await looms.getRun(runId)

  while (state.status !== status && Date.now() < deadline) {
    await Bun.sleep(10)
    state = await looms.getRun(runId)
  }

  return state
}

describe('child runs', () => {
  test('returns a child run result to the spawning node', async () => {
    const looms = createLooms({ modules: [workflow({ definitions: [child, parent] })] })
    const started = await looms.start(parent, {})
    const state = await waitForStatus(looms, started.runId, 'completed')
    const events = await looms.getEvents(started.runId)
    const launched = events.find((event) => event.type === 'runtime.run.launched')

    const childRunId =
      launched && Predicate.isObject(launched.payload) && Predicate.isString(launched.payload.runId)
        ? launched.payload.runId
        : undefined

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toBe(7)
    expect(childRunId).toEqual(expect.any(String))

    const childState = await looms.getRun(childRunId ?? '')
    expect(childState.status).toBe('completed')
    expect(childState.startIdentity?.launchedBy?.runId).toBe(started.runId)
    expect(events.some((event) => event.type === 'runtime.child.settled')).toBe(true)

    await looms.stop()
  })

  test('collects mapped child runs in item order', async () => {
    const looms = createLooms({
      modules: [workflow({ definitions: [mappedChild, mappedParent] })],
    })

    const started = await looms.start(mappedParent, {})
    const state = await waitForStatus(looms, started.runId, 'completed')
    const events = await looms.getEvents(started.runId)
    const launched = events.filter((event) => event.type === 'runtime.run.launched')

    expect(state.status).toBe('completed')
    expect(rootOutput(state)).toEqual([1, 2])
    expect(launched).toHaveLength(2)

    await looms.stop()
  })

  test('keeps the default of running a child in the parent run', async () => {
    const threaded = defineWorkflow({
      name: 'threaded-parent',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(child, {}) }],
    })

    const looms = createLooms({ modules: [workflow({ definitions: [child, threaded] })] })
    const started = await looms.start(threaded, {})
    const events = await looms.getEvents(started.runId)

    expect(started.state.status).toBe('completed')
    expect(events.some((event) => event.type === 'runtime.run.launched')).toBe(false)
    expect(rootOutput(started.state)).toEqual({ spawn: 7 })

    await looms.stop()
  })

  test('terminates child runs when the parent is cancelled', async () => {
    const terminating = defineWorkflow({
      name: 'terminating-parent',
      childExecution: 'run',
      childClose: 'terminate',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(sleepyChild, {}) }],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [sleepyChild, terminating] })],
    })

    const started = await looms.start(terminating, {})
    const eventsBefore = await looms.getEvents(started.runId)
    const launched = eventsBefore.find((event) => event.type === 'runtime.run.launched')

    const childRunId =
      launched && Predicate.isObject(launched.payload) && Predicate.isString(launched.payload.runId)
        ? launched.payload.runId
        : ''

    expect(started.state.status).toBe('running')

    const cancelled = await looms.cancel(started.runId)
    const events = await looms.getEvents(started.runId)
    const childState = await looms.getRun(childRunId)

    expect(cancelled.status).toBe('cancelled')
    expect(childState.status).toBe('cancelled')

    expect(
      events.some(
        (event) =>
          event.type === 'runtime.child.close.requested' &&
          Predicate.isObject(event.payload) &&
          event.payload.policy === 'wait',
      ),
    ).toBe(false)

    await looms.stop()
  })

  test('waits for child runs to finish cancelling', async () => {
    const waiting = defineWorkflow({
      name: 'waiting-parent',
      childExecution: 'run',
      childClose: 'wait',
      nodes: [{ id: 'spawn', run: (ctx) => ctx.spawn(sleepyChild, {}) }],
    })

    const looms = createLooms({ modules: [workflow({ definitions: [sleepyChild, waiting] })] })
    const started = await looms.start(waiting, {})

    const launched = (await looms.getEvents(started.runId)).find(
      (event) => event.type === 'runtime.run.launched',
    )

    const childRunId =
      launched && Predicate.isObject(launched.payload) && Predicate.isString(launched.payload.runId)
        ? launched.payload.runId
        : ''

    const cancelled = await looms.cancel(started.runId)
    const events = await looms.getEvents(started.runId)
    const types = events.map((event) => event.type)
    const childState = await looms.getRun(childRunId)

    expect(cancelled.status).toBe('cancelled')
    expect(childState.status).toBe('cancelled')
    expect(types.indexOf('runtime.child.close.requested')).toBeGreaterThanOrEqual(0)

    expect(types.indexOf('runtime.child.close.requested')).toBeLessThan(
      types.indexOf('runtime.run.cancelled'),
    )

    expect(events.find((event) => event.type === 'runtime.child.close.requested')).toMatchObject({
      payload: { policy: 'wait' },
    })

    await looms.stop()
  })
})
