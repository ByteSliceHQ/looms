import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { makeMemoryEventStore } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLocalActorHost } from './host'

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
      modules: [workflow()],
      definitions: [flow],
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

    // SAFETY: start run response json contains runId
    const body1 = (await start1.json()) as { runId: string }
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

    // SAFETY: start run response json contains runId
    const body2 = (await start2.json()) as { runId: string }
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

    host.dispose()
  })
})
