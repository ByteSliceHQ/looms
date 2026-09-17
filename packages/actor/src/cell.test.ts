import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { makeMemoryEventStore, wait } from '@looms/core'
import type { WakeScheduler } from '@looms/runtime'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createActorCell } from './cell'

const decodeRunResponse = Schema.decodeUnknownSync(
  Schema.Struct({
    runId: Schema.String,
    state: Schema.Struct({ status: Schema.String }),
  }),
)

describe('ActorCell', () => {
  test('starts a run and serves HTTP endpoints for its own runId', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_cell_1'

    const flow = defineWorkflow({
      name: 'simple-flow',
      nodes: [
        {
          id: 'step1',
          run: () => ({ success: true }),
        },
      ],
    })

    const cell = createActorCell({
      runId,
      store,
      modules: [workflow({ definitions: [flow] })],
    })

    // Start run through cell.fetch
    const startRes = await cell.fetch(
      new Request('http://localhost:8787/runs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-looms-run-id': runId,
        },
        body: JSON.stringify({
          kind: 'workflow',
          definitionName: 'simple-flow',
          runId,
        }),
      }),
    )

    expect(startRes.status).toBe(200)

    const startBody = decodeRunResponse(await startRes.json())

    expect(startBody.runId).toBe(runId)
    expect(startBody.state.status).toBe('completed')

    // Read run state through cell.fetch
    const getRes = await cell.fetch(
      new Request(`http://localhost:8787/runs/${runId}`, {
        method: 'GET',
      }),
    )

    expect(getRes.status).toBe(200)

    const getBody = decodeRunResponse(await getRes.json())

    expect(getBody.state.status).toBe('completed')

    // Foreign runId should be rejected with 404
    const foreignRes = await cell.fetch(
      new Request('http://localhost:8787/runs/other_run_id', {
        method: 'GET',
      }),
    )

    expect(foreignRes.status).toBe(404)

    await cell.dispose()
  })

  test('parks on timer and notifies scheduler', async () => {
    const store = await Effect.runPromise(makeMemoryEventStore)
    const runId = 'run_timer_cell'
    const targetAt = Date.now() + 5000

    const scheduled: Array<{ runId: string; at: number }> = []
    const cancelled: string[] = []

    const fakeScheduler: WakeScheduler = {
      schedule: (id, at) =>
        Effect.sync(() => scheduled.push({ runId: id, at })).pipe(Effect.asVoid),
      cancel: (id) => Effect.sync(() => cancelled.push(id)).pipe(Effect.asVoid),
    }

    const sleeper = defineWorkflow({
      name: 'sleeper',
      nodes: [
        {
          id: 'step1',
          run: (ctx) => ctx.effects([wait({ waitId: 'w_timer', on: { timerAt: targetAt } })]),
        },
      ],
    })

    const cell = createActorCell({
      runId,
      store,
      scheduler: fakeScheduler,
      modules: [workflow({ definitions: [sleeper] })],
    })

    const startRes = await cell.fetch(
      new Request('http://localhost:8787/runs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-looms-run-id': runId,
        },
        body: JSON.stringify({
          kind: 'workflow',
          definitionName: 'sleeper',
          runId,
        }),
      }),
    )

    expect(startRes.status).toBe(200)
    expect(scheduled.length).toBe(1)
    expect(scheduled[0]?.runId).toBe(runId)
    expect(scheduled[0]?.at).toBe(targetAt)

    // Direct cell.wake()
    const state = await cell.wake()

    expect(state.status).toBe('running')

    await cell.dispose()
  })
})
