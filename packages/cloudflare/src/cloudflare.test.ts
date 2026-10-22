import { Database } from 'bun:sqlite'
import { describe, expect, mock, setSystemTime, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { createLocalActorHost } from '@looms/actor'
import { DefinitionCatalogSchema, emptyRunState, makeMemoryEventStore } from '@looms/core'
import { defineSchedule, ensureSchedule, every, once, schedule } from '@looms/schedule'
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

const { LoomsDurableObject, durableObjectLauncher, durableObjectScheduleHost } =
  await import('./durable-object')

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
    const { scheduler } = durableObjectAlarms(storage, () => Effect.sync(() => projectorDeadline))

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

    await Promise.all([
      Effect.runPromise(alarms.scheduleAtEarliest(2_000)),
      Effect.runPromise(alarms.scheduleAtEarliest(500)),
    ])

    expect(storage.current()).toBe(500)

    await Effect.runPromise(alarms.scheduleAtEarliest(3_000))
    expect(storage.current()).toBe(1_000)
  })

  test('durableObjectAlarms keeps an existing earlier alarm until the runtime reports', async () => {
    const storage = fakeAlarmStorage(2_000)
    const alarms = durableObjectAlarms(storage)

    await Promise.all([
      Effect.runPromise(alarms.scheduleAtEarliest(500)),
      Effect.runPromise(alarms.scheduleAtEarliest(1_000)),
    ])

    expect(storage.current()).toBe(500)

    await Effect.runPromise(alarms.scheduleAtEarliest(3_000))
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

const decodeCatalog = Schema.decodeUnknownSync(DefinitionCatalogSchema)

const decodeScheduleThread = Schema.decodeUnknownSync(
  Schema.Struct({
    fireCount: Schema.Finite,
    retired: Schema.Boolean,
    paused: Schema.Boolean,
    nextAt: Schema.NullOr(Schema.Finite),
    invalid: Schema.NullOr(Schema.String),
  }),
)

function scheduleThreadOf(state: {
  rootThreadId: string | null
  threads: Record<string, { state: unknown }>
}) {
  const threadId = state.rootThreadId

  if (!threadId) {
    throw new Error('schedule run has no root thread')
  }

  return decodeScheduleThread(state.threads[threadId]?.state)
}

interface ObjectStorage {
  readonly sql: { exec(query: string, ...bindings: readonly unknown[]): Iterable<unknown> }
  transactionSync<T>(fn: () => T): T
  getAlarm(): Promise<number | null>
  setAlarm(at: number | Date): Promise<void>
  deleteAlarm(): Promise<void>
  alarmAt(): number | null
  writes(): number
  resetWrites(): void
}

function sqliteStorage(): ObjectStorage {
  const db = new Database(':memory:')
  let alarm: number | null = null
  let counting = false
  let writeCount = 0

  const sql = {
    exec(query: string, ...bindings: readonly unknown[]) {
      const text = query.trim()

      if (counting && /^(insert|update|delete)\b/i.test(text)) {
        writeCount += 1
      }

      if (/^(select|pragma)\b/i.test(text)) {
        return db.query(query).all(...bindings)
      }

      db.run(query, [...bindings])
      return []
    },
  }

  return {
    sql,
    transactionSync(fn) {
      db.run('BEGIN')

      try {
        const result = fn()
        db.run('COMMIT')
        return result
      } catch (error) {
        db.run('ROLLBACK')
        throw error
      }
    },
    getAlarm: async () => alarm,
    setAlarm: async (at) => {
      if (counting) {
        writeCount += 1
      }

      alarm = at instanceof Date ? at.getTime() : at
    },
    deleteAlarm: async () => {
      if (counting) {
        writeCount += 1
      }

      alarm = null
    },
    alarmAt: () => alarm,
    writes: () => writeCount,
    resetWrites: () => {
      writeCount = 0
      counting = true
    },
  }
}

function objectContext(name: string, storage: ObjectStorage) {
  return {
    id: { name, toString: () => name },
    storage,
  }
}

describe('schedule durable objects', () => {
  test('launch returns before the target runs, and a duplicate alarm fires once', async () => {
    const storages = new Map<string, ObjectStorage>()

    const namespace = {
      getByName(name: string) {
        const existing = objects.get(name)

        if (existing) {
          return existing
        }

        const storage = sqliteStorage()
        storages.set(name, storage)

        const created = new ScheduleObject(objectContext(name, storage), {})
        objects.set(name, created)
        return created
      },
    }

    const objects = new Map<string, ScheduleObject>()
    let ran = false

    const flow = defineWorkflow({
      name: 'cf-job',
      nodes: [
        {
          id: 'work',
          run: () => {
            ran = true
            return { ok: true }
          },
        },
      ],
    })

    const binding = defineSchedule({
      name: 'cf-binding',
      target: flow,
      spec: once(1),
    })

    class ScheduleObject extends LoomsDurableObject {
      override configure() {
        return {
          modules: [workflow({ definitions: [flow] }), schedule({ definitions: [binding] })],
          launcher: durableObjectLauncher(namespace),
        }
      }
    }

    const target = namespace.getByName('cf-job-run')

    await target.launch({
      runId: 'cf-job-run',
      kind: 'workflow',
      definitionName: 'cf-job',
    })

    expect(ran).toBe(false)
    await target.alarm()
    expect(ran).toBe(true)

    const scheduleObject = namespace.getByName('cf-schedule')

    await scheduleObject.startRun({
      runId: 'cf-schedule',
      kind: 'schedule',
      definitionName: 'cf-binding',
      input: null,
    })

    const thread = scheduleThreadOf(await scheduleObject.getRun())

    expect(thread.fireCount).toBe(1)
    await scheduleObject.alarm()
    expect(scheduleThreadOf(await scheduleObject.getRun()).fireCount).toBe(1)

    const fired = await namespace.getByName('cf-schedule:fire:1').getRun()
    expect(fired.startIdentity?.launchedBy?.runId).toBe('cf-schedule')
    expect(fired.startIdentity?.correlationId).toBe('cf-schedule')
  })

  test('a schedule without a launcher fails with the unavailable message', async () => {
    const binding = defineSchedule({
      name: 'needs-launcher',
      target: defineWorkflow({ name: 'unused-job', nodes: [{ id: 'work', run: () => null }] }),
      spec: once(1),
    })

    class BareObject extends LoomsDurableObject {
      override configure() {
        return {
          modules: [
            workflow({
              definitions: [
                defineWorkflow({ name: 'unused-job', nodes: [{ id: 'work', run: () => null }] }),
              ],
            }),
            schedule({ definitions: [binding] }),
          ],
        }
      }
    }

    const storage = sqliteStorage()

    const object = new BareObject(objectContext('bare', storage), {})

    await object.startRun({
      runId: 'bare',
      kind: 'schedule',
      definitionName: 'needs-launcher',
      input: null,
    })

    const events = await object.fetch(new Request('http://localhost/runs/bare/events'))
    expect(events.status).toBe(200)
    expect(await events.text()).toContain('No RunLauncher')
  })

  test('ensureSchedule, retirement, definitions, and the row budget', async () => {
    const objects = new Map<string, BudgetObject>()
    const storages = new Map<string, ObjectStorage>()

    const namespace = {
      getByName(name: string) {
        const existing = objects.get(name)

        if (existing) {
          return existing
        }

        const storage = sqliteStorage()
        storages.set(name, storage)
        const created = new BudgetObject(objectContext(name, storage), {})
        objects.set(name, created)
        return created
      },
    }

    const flow = defineWorkflow({
      name: 'budget-job',
      nodes: [{ id: 'work', run: () => ({ ok: true }) }],
    })

    const binding = defineSchedule({
      name: 'budget',
      target: flow,
      spec: every(60_000),
    })

    class BudgetObject extends LoomsDurableObject {
      override configure() {
        return {
          modules: [
            workflow({ definitions: [flow] }),
            schedule({ definitions: [binding], minIntervalMs: 1 }),
          ],
          launcher: durableObjectLauncher(namespace),
        }
      }
    }

    const host = durableObjectScheduleHost(namespace)

    expect(await ensureSchedule(host, binding, 'budget-schedule')).toBe('started')
    expect(await ensureSchedule(host, binding, 'budget-schedule')).toBe('unchanged')

    const scheduleObject = namespace.getByName('budget-schedule')
    const storage = storages.get('budget-schedule')

    if (!storage) {
      throw new Error('missing schedule storage')
    }

    expect(storage.alarmAt()).not.toBeNull()

    await scheduleObject.signal([{ type: 'schedule.retired', payload: {} }])
    expect(storage.alarmAt()).toBeNull()

    const definitions = await routeToDurableObject(
      namespace,
      new Request('http://localhost/definitions'),
      {
        modules: [
          workflow({ definitions: [flow] }),
          schedule({ definitions: [binding], minIntervalMs: 1 }),
        ],
      },
    )

    const catalog = decodeCatalog(await definitions?.json())
    expect(catalog.definitions.some((definition) => definition.kind === 'schedule')).toBe(true)

    const pulse = defineSchedule({
      name: 'pulse',
      target: flow,
      spec: every(60_000),
    })

    class PulseObject extends LoomsDurableObject {
      override configure() {
        return {
          modules: [
            workflow({ definitions: [flow] }),
            schedule({ definitions: [pulse], minIntervalMs: 1 }),
          ],
          launcher: durableObjectLauncher(namespace),
        }
      }
    }

    const pulseStorage = sqliteStorage()
    const pulseObject = new PulseObject(objectContext('pulse', pulseStorage), {})

    await pulseObject.startRun({
      runId: 'pulse',
      kind: 'schedule',
      definitionName: 'pulse',
      input: null,
    })

    const startedThread = scheduleThreadOf(await pulseObject.getRun())
    pulseStorage.resetWrites()
    setSystemTime((startedThread.nextAt ?? 0) + 1)

    try {
      await pulseObject.alarm()
    } finally {
      setSystemTime()
    }

    expect(pulseStorage.writes()).toBeGreaterThan(0)
    expect(pulseStorage.writes()).toBeLessThanOrEqual(8)
    expect(pulseStorage.alarmAt()).not.toBeNull()

    await pulseObject.signal([{ type: 'schedule.paused', payload: {} }])
    expect(pulseStorage.alarmAt()).toBeNull()
  })
})
