import { describe, expect, mock, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { createLocalActorHost } from '@looms/actor'
import { emptyRunState, makeMemoryEventStore } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

// Mock cloudflare:workers for bun test runtime before importing durable-object
void mock.module('cloudflare:workers', () => ({
  DurableObject: class {
    // SAFETY: test mock for cloudflare:workers DurableObject
    ctx: any
    // SAFETY: test mock for cloudflare:workers DurableObject
    env: any

    // SAFETY: test mock constructor for cloudflare:workers DurableObject
    constructor(ctx: any, env: any) {
      this.ctx = ctx
      this.env = env
    }
  },
}))

const { LoomsDurableObject } = await import('./durable-object')
const { durableObjectAlarms } = await import('./alarm-scheduler')
const { routeToDurableObject } = await import('./router')
import type { AlarmStorage } from './alarm-scheduler'
import type { LoomsDurableObjectConfig } from './durable-object'

const decodeHealth = Schema.decodeUnknownSync(Schema.Struct({ ok: Schema.Boolean }))

const decodeRunResponse = Schema.decodeUnknownSync(
  Schema.Struct({
    runId: Schema.String,
    state: Schema.Struct({ status: Schema.String }),
  }),
)

function fakeAlarmStorage(initial: number | null): AlarmStorage & { current(): number | null } {
  let alarm = initial

  return {
    current: () => alarm,
    getAlarm: async () => alarm,
    setAlarm: async (at) => {
      alarm = at instanceof Date ? +at : at
    },
    deleteAlarm: async () => {
      alarm = null
    },
  }
}

describe('@looms/cloudflare', () => {
  test('durableObjectAlarms schedules and deletes the runtime alarm', async () => {
    const storage = fakeAlarmStorage(null)
    const { scheduler } = durableObjectAlarms(storage)

    await Effect.runPromise(scheduler.schedule('run_1', 1234567890))
    expect(storage.current()).toBe(1234567890)

    await Effect.runPromise(scheduler.cancel('run_1'))
    expect(storage.current()).toBeNull()
  })

  test('durableObjectAlarms preserves an earlier projector retry deadline', async () => {
    let projectorDeadline: number | null = 500
    const storage = fakeAlarmStorage(500)
    const { scheduler } = durableObjectAlarms(storage, async () => projectorDeadline)

    await Effect.runPromise(scheduler.schedule('run_1', 1_000))
    expect(storage.current()).toBe(500)

    await Effect.runPromise(scheduler.cancel('run_1'))
    expect(storage.current()).toBe(500)

    projectorDeadline = null
    await Effect.runPromise(scheduler.cancel('run_1'))
    expect(storage.current()).toBeNull()
  })

  test('durableObjectAlarms keeps the runtime deadline when a retry is requested', async () => {
    const storage = fakeAlarmStorage(null)
    const alarms = durableObjectAlarms(storage)

    await Effect.runPromise(alarms.scheduler.schedule('run_1', 1_000))
    await Promise.all([alarms.scheduleAtEarliest(2_000), alarms.scheduleAtEarliest(500)])
    expect(storage.current()).toBe(500)

    await alarms.scheduleAtEarliest(3_000)
    expect(storage.current()).toBe(1_000)
  })

  test('durableObjectAlarms keeps an existing earlier alarm until the runtime reports', async () => {
    const storage = fakeAlarmStorage(2_000)
    const alarms = durableObjectAlarms(storage)

    await Promise.all([alarms.scheduleAtEarliest(500), alarms.scheduleAtEarliest(1_000)])
    expect(storage.current()).toBe(500)

    await alarms.scheduleAtEarliest(3_000)
    expect(storage.current()).toBe(500)
  })

  test('routeToDurableObject handles health and rejects global runs listing', async () => {
    const fakeNamespace = {
      getByName: () => ({
        fetch: async () => new Response('stub'),
      }),
    }

    const healthRes = await routeToDurableObject(
      fakeNamespace,
      new Request('http://localhost:8787/health'),
    )

    expect(healthRes?.status).toBe(200)

    const healthBody = decodeHealth(await healthRes?.json())

    expect(healthBody.ok).toBe(true)

    const runsRes = await routeToDurableObject(
      fakeNamespace,
      new Request('http://localhost:8787/runs', { method: 'GET' }),
    )

    expect(runsRes?.status).toBe(501)

    const rootRes = await routeToDurableObject(
      fakeNamespace,
      new Request('http://localhost:8787/', { method: 'GET' }),
    )

    expect(rootRes).toBeNull()
  })

  test('routeToDurableObject propagates Durable Object failures', async () => {
    const failure = new Error('backend unavailable')

    const namespace = {
      getByName: () => ({
        fetch: () => Promise.reject(failure),
      }),
    }

    const caught = await routeToDurableObject(
      namespace,
      new Request('http://localhost:8787/runs/run_1'),
    ).then(
      () => undefined,
      (error: Error) => error,
    )

    expect(caught).toBe(failure)
  })

  test('routeToDurableObject routes start and signal to namespace stub', async () => {
    const stores = new Map<string, Awaited<ReturnType<typeof makeMemoryEventStore>>>()

    const flow = defineWorkflow({
      name: 'cf-flow',
      nodes: [
        {
          id: 'step1',
          run: () => ({ routed: true }),
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

    const fakeNamespace = {
      getByName: (name: string) => ({
        fetch: async (req: Request) => {
          const cell = await host.getCell(name)
          return cell.fetch(req)
        },
      }),
    }

    // POST /runs through routeToDurableObject
    const startRes = await routeToDurableObject(
      fakeNamespace,
      new Request('http://localhost:8787/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'workflow', definitionName: 'cf-flow' }),
      }),
    )

    expect(startRes?.status).toBe(200)

    const startBody = decodeRunResponse(await startRes?.json())

    expect(startBody.runId).toMatch(/^run_/)
    expect(startBody.state.status).toBe('completed')

    // Read back through router
    const readRes = await routeToDurableObject(
      fakeNamespace,
      new Request(`http://localhost:8787/runs/${startBody.runId}`, { method: 'GET' }),
    )

    expect(readRes?.status).toBe(200)

    const readBody = decodeRunResponse(await readRes?.json())

    expect(readBody.runId).toBe(startBody.runId)

    // Verify SSE streaming through routeToDurableObject via the run event resource
    const streamRes = await routeToDurableObject(
      fakeNamespace,
      new Request(`http://localhost:8787/runs/${startBody.runId}/events?live=true`, {
        method: 'GET',
        headers: { accept: 'text/event-stream' },
      }),
    )

    expect(streamRes?.status).toBe(200)
    expect(streamRes?.headers.get('content-type')).toContain('text/event-stream')

    const reader = streamRes?.body?.getReader()
    expect(reader).toBeDefined()
    const firstChunk = await reader?.read()
    expect(firstChunk?.done).toBe(false)
    await reader?.cancel()

    await host.dispose()
  })

  test('LoomsDurableObject executes runs and wakes on alarm', async () => {
    const fakeSql = {
      exec: () => {
        throw new Error('Not used with mocked store')
      },
    }

    const fakeStorage = {
      sql: fakeSql,
      setAlarm: async (_at: number | Date) => {},
      deleteAlarm: async () => {},
    }

    const fakeCtx = {
      id: {
        name: 'run_test_do',
        toString: () => 'run_test_do',
      },
      storage: fakeStorage,
    }

    const delayedFlow = defineWorkflow({
      name: 'delayed-flow',
      nodes: [
        {
          id: 'wait_node',
          run: (ctx) => ctx.wait({ type: 'continue.signal' }),
        },
      ],
    })

    class TestDO extends LoomsDurableObject {
      override configure(): LoomsDurableObjectConfig {
        return {
          modules: [workflow({ definitions: [delayedFlow] })],
        }
      }
    }

    // SAFETY: instantiate mock DO with fake ctx and env
    // @ts-expect-error mock fakeCtx in unit test
    const doInstance = new TestDO(fakeCtx, {})

    let alarmWoken = false

    const wakeMock = {
      fetch: async () => new Response(JSON.stringify({ ok: true })),
      wake: async () => {
        alarmWoken = true
        return emptyRunState('run_test_do')
      },
      dispose: () => {},
    }

    Object.defineProperty(doInstance, 'cellPromise', {
      value: Promise.resolve(wakeMock),
    })

    await doInstance.alarm()
    expect(alarmWoken).toBe(true)

    const fetchRes = await doInstance.fetch(new Request('http://localhost/health'))
    expect(fetchRes.status).toBe(200)
  })
})
