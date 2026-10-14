import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  defineEffect,
  defineRuntimeModule,
  EventStoreTag,
  invoke,
  makeMemoryEventStore,
} from '@looms/core'
import { bearerAuth, type EffectWorkerTask } from '@looms/runtime'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLocalActorHost } from './host'

const decodeRunId = Schema.decodeUnknownSync(Schema.Struct({ runId: Schema.String }))

describe('LocalActorHost', () => {
  test('routes start, signals, and reads to distinct isolated cells', async () => {
    const stores = new Map<string, Awaited<ReturnType<typeof makeMemoryEventStore>>>()

    const flow = defineWorkflow({
      name: 'counter',
      nodes: [
        {
          id: 'step1',
          run: () => ({ count: 1 }),
        },
      ],
    })

    const host = createLocalActorHost({
      createStore: async (runId) => {
        let store = stores.get(runId)

        if (!store) {
          store = await Effect.runPromise(makeMemoryEventStore)
          stores.set(runId, store)
        }

        return store
      },
      modules: [workflow({ definitions: [flow] })],
    })

    // Start first run
    const start1 = await host.fetch(
      new Request('http://localhost:8787/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'workflow', definitionName: 'counter' }),
      }),
    )

    expect(start1.status).toBe(200)

    const body1 = decodeRunId(await start1.json())
    const runId1 = body1.runId

    // Start second run
    const start2 = await host.fetch(
      new Request('http://localhost:8787/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'workflow', definitionName: 'counter' }),
      }),
    )

    expect(start2.status).toBe(200)

    const body2 = decodeRunId(await start2.json())
    const runId2 = body2.runId

    expect(runId1).not.toBe(runId2)

    // Check runs exist in their own distinct stores
    expect(stores.has(runId1)).toBe(true)
    expect(stores.has(runId2)).toBe(true)

    // Check reading each run
    const read1 = await host.fetch(
      new Request(`http://localhost:8787/runs/${runId1}`, { method: 'GET' }),
    )

    expect(read1.status).toBe(200)

    const read2 = await host.fetch(
      new Request(`http://localhost:8787/runs/${runId2}`, { method: 'GET' }),
    )

    expect(read2.status).toBe(200)

    // Actor hosts have no global run index — align with DO/celld (501).
    const listRes = await host.fetch(new Request('http://localhost:8787/runs', { method: 'GET' }))

    expect(listRes?.status).toBe(501)

    const summaries = await host.fetch(
      new Request('http://localhost:8787/runs/summaries', { method: 'GET' }),
    )

    expect(summaries?.status).toBe(501)

    const fork = await host.fetch(
      new Request(`http://localhost:8787/runs/${runId2}/fork`, { method: 'POST' }),
    )

    expect(fork?.status).toBe(501)

    await host.dispose()
  })
})

test('local actor host forwards external execution and admits authenticated callbacks', async () => {
  const tasks: EffectWorkerTask[] = []
  const effect = defineEffect({ type: 'external.check' })

  const flow = defineWorkflow({
    name: 'external-flow',
    nodes: [{ id: 'check', run: (ctx) => ctx.effects([invoke(effect, {})]) }],
  })

  const host = createLocalActorHost({
    createStore: () => Effect.runPromise(makeMemoryEventStore),
    modules: [
      defineRuntimeModule({ namespace: 'external', protocolVersion: '1', effects: { effect } }),
      workflow({ definitions: [flow] }),
    ],
    worker: {
      handles: [effect.type],
      dispatch: (task) => {
        tasks.push(task)
        return Promise.resolve()
      },
    },
    authorize: bearerAuth({ worker: 'test-worker' }),
  })

  try {
    await host.fetch(
      new Request('http://looms/runs', {
        method: 'POST',
        body: JSON.stringify({ kind: 'workflow', definitionName: flow.name }),
      }),
    )

    expect(tasks).toHaveLength(1)
    const task = tasks[0]

    if (!task) {
      throw new Error('No external dispatch')
    }

    const callback = await host.fetch(
      new Request(
        `http://looms/runs/${task.runId}/effects/${task.effectId}/${task.attempt}/complete`,
        {
          method: 'POST',
          headers: { authorization: 'Bearer test-worker' },
          body: JSON.stringify({
            kind: 'complete',
            effectId: task.effectId,
            attempt: task.attempt,
            events: [],
          }),
        },
      ),
    )

    expect(callback?.status).toBe(200)
    const cell = await host.getCell(task.runId)

    const state = await Effect.runPromise(
      cell.runtime.getRun(task.runId).pipe(Effect.provideService(EventStoreTag, cell.store)),
    )

    expect(state.completedEffectIds).toContain(task.effectId)
  } finally {
    await host.dispose()
  }
})
