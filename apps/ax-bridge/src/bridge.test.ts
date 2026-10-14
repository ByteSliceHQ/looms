import { expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'

import { Effect } from 'effect'

import {
  complete,
  defineEffect,
  defineRuntimeModule,
  defineThread,
  invoke,
  type JsonValue,
} from '@looms/core'
import { bearerAuth, createLooms, type EffectWorkerTask } from '@looms/runtime'

import { axJobId, type AxSubmission } from '../../../packages/ax/src/protocol'
import { createAxWorker } from '../../../packages/ax/src/worker'
import { createBridge } from './bridge'
import { conflict, type Job, type JobStore, type Profile } from './model'

function memoryStore(): JobStore {
  const jobs = new Map<string, Job>()

  return {
    accept: (job) => {
      const old = jobs.get(job.id)

      if (old && old.requestHash !== job.requestHash) {
        conflict('Conflicting AX job submission')
      }

      const accepted = old ? { ...old, cancelled: old.cancelled || job.cancelled } : job
      jobs.set(job.id, accepted)
      return Promise.resolve(accepted)
    },
    get: (id) => Promise.resolve(jobs.get(id) ?? null),
    update: (id, fn) => {
      const old = jobs.get(id)

      if (!old) {
        throw new Error('Missing job')
      }

      const value = fn(old)
      jobs.set(id, value)
      return Promise.resolve(value)
    },
    pending: () =>
      Promise.resolve(
        [...jobs.values()].filter(
          (job) => !job.stopped || job.delivery === 'pending' || job.delivery === 'uncertain',
        ),
      ),
    siblings: (key) => Promise.resolve([...jobs.values()].filter((job) => job.logicalKey === key)),
  }
}

const token = 'host-token-with-at-least-32-characters'
const secret = 'capability-secret-with-at-least-32-characters'

const profile: Profile = {
  id: 'test-v1',
  effectType: 'worker.do',
  image: `fixture@sha256:${'a'.repeat(64)}`,
  command: ['test'],
  gateway: 'test',
  allowedEvents: ['worker.done'],
  maxDurationMs: 60_000,
}

function setup() {
  const store = memoryStore()
  const launched: string[] = []
  let mayStop = true
  let loseSubmission = false
  let loseCallback = false
  let rejectCancellation = false
  const definition = { kind: 'worker-test', name: 'worker-test' }

  const effect = defineEffect({
    type: 'worker.do',
    retry: {
      maxAttempts: 2,
      backoffMs: 1,
      scheduleToStartTimeoutMs: 60_000,
      startToCloseTimeoutMs: 60_000,
      heartbeatTimeoutMs: 60_000,
      cancellationTimeoutMs: 60_000,
    },
  })

  const module = defineRuntimeModule({
    namespace: 'worker',
    protocolVersion: '1.0.0',
    effects: { effect },
    definitions: [definition],
    threads: {
      'worker-test': defineThread({
        kind: 'worker-test',
        initialState: () => false,
        step: (done, event) => done || event.type === 'worker.done',
        effects: (done) => (done ? [complete({ ok: true })] : [invoke(effect, {}, 'work')]),
      }),
    },
  })

  const config = {
    scope: 'test',
    hostToken: token,
    capabilitySecret: secret,
    profiles: [profile],
    target: { id: 'test', endpoint: 'http://looms', readToken: token, workerToken: token },
  }

  const ax = {
    ready: () => Promise.resolve(true),
    ensure: (job: Job) => {
      launched.push(job.id)
      return Promise.resolve()
    },
    stop: () => Promise.resolve(mayStop),
  }

  const looms = createLooms({
    modules: [module],
    authorize: bearerAuth({ read: token, worker: token }),
    worker: createAxWorker({
      endpoint: 'http://bridge',
      allowInsecureHttp: true,
      token,
      scope: 'test',
      callbackTarget: 'test',
      routes: { 'worker.do': { profile: profile.id } },
      fetch: async (input, init) => {
        const response = await bridge.fetch(new Request(input, init))

        if (loseSubmission) {
          loseSubmission = false
          throw new Error('Injected response loss after acceptance')
        }

        return response
      },
    }),
  })

  const bridge = createBridge(config, store, ax, async (input, init) => {
    const request = new Request(input, init)

    if (rejectCancellation && request.url.endsWith('/cancelled')) {
      return new Response(null, { status: 503 })
    }

    const response = await looms.fetch(request)

    if (loseCallback && request.method === 'POST') {
      loseCallback = false
      throw new Error('Injected response loss after callback commit')
    }

    return response ?? new Response(null, { status: 404 })
  })

  const worker = (
    id: string,
    action: string,
    body: JsonValue,
    credential = createHmac('sha256', secret).update(id).digest('hex'),
  ) =>
    bridge.fetch(
      new Request(`http://bridge/v1/jobs/${id}/${action}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${credential}` },
        body: JSON.stringify(body),
      }),
    )

  return {
    store,
    bridge,
    looms,
    definition,
    launched,
    worker,
    loseNextSubmission: () => {
      loseSubmission = true
    },
    loseNextCallback: () => {
      loseCallback = true
    },
    blockStop: () => {
      mayStop = false
    },
    allowStop: () => {
      mayStop = true
    },
    rejectCancellation: (reject: boolean) => {
      rejectCancellation = reject
    },
  }
}

test('durable acceptance, begin gate, duplicate result and callback recovery preserve one outcome', async () => {
  const f = setup()

  try {
    const run = await f.looms.start(f.definition, {})
    const [job] = await f.store.pending()
    expect(job).toBeDefined()

    if (!job) {
      throw new Error('No job')
    }

    expect(f.launched).toHaveLength(0)
    await Effect.runPromise(f.bridge.reconcile)
    expect(f.launched).toEqual([job.id])
    const instance = 'worker-instance-000001'
    expect((await f.worker(job.id, 'begin', { instance })).status).toBe(200)
    expect((await f.worker(job.id, 'begin', { instance })).status).toBe(409)

    expect((await f.worker(job.id, 'begin', { instance: 'restarted-process-0002' })).status).toBe(
      409,
    )

    expect(
      (
        await f.worker(job.id, 'result', {
          instance,
          outcome: { kind: 'complete', events: [{ type: 'runtime.run.completed', payload: {} }] },
        })
      ).status,
    ).toBe(400)

    const terminal = {
      instance,
      outcome: { kind: 'complete', events: [{ type: 'worker.done', payload: { ok: true } }] },
    }

    expect((await f.worker(job.id, 'result', terminal)).status).toBe(200)
    expect((await f.worker(job.id, 'result', terminal)).status).toBe(200)

    expect(
      (
        await f.worker(job.id, 'result', {
          instance,
          outcome: { kind: 'fail', error: 'different' },
        })
      ).status,
    ).toBe(409)

    await Effect.runPromise(f.bridge.reconcile)
    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.looms.getRun(run.runId)).status).toBe('completed')

    expect(
      (await f.looms.getEvents(run.runId)).filter((event) => event.type === 'worker.done'),
    ).toHaveLength(1)

    expect((await f.store.get(job.id))?.delivery).toBe('applied')
  } finally {
    await f.looms.stop()
  }
})

test('cancel-before-submit persists a tombstone and prevents resurrecting work', async () => {
  const f = setup()

  const task: EffectWorkerTask = {
    runId: 'not-started',
    effectId: 'e',
    attempt: 1,
    type: 'worker.do',
    input: {},
  }

  const id = await axJobId('test', task)

  const submission: AxSubmission = {
    protocol: 1,
    scope: 'test',
    callbackTarget: 'test',
    profile: profile.id,
    task,
  }

  const put = (suffix: string, body = submission) =>
    f.bridge.fetch(
      new Request(`http://bridge/v1/jobs/${id}${suffix}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }),
    )

  expect((await put('/cancellation')).status).toBe(202)
  expect((await put('')).status).toBe(202)
  expect((await f.store.get(id))?.cancelled).toBe(true)

  expect(
    (await put('', { ...submission, task: { ...task, input: { different: true } } })).status,
  ).toBe(409)

  expect((await f.worker(id, 'begin', { instance: 'new-worker-instance' })).status).toBe(409)
  expect(f.launched).toHaveLength(0)
  await f.looms.stop()
})

test('failed teardown remains pending; cancellation only settles after confirmed stop', async () => {
  const f = setup()

  try {
    const run = await f.looms.start(f.definition, {})
    const [job] = await f.store.pending()

    if (!job) {
      throw new Error('No job')
    }

    await Effect.runPromise(f.bridge.reconcile)
    f.blockStop()
    await f.looms.cancel(run.runId)
    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.store.get(job.id))?.stopped).toBe(false)

    expect(
      (await f.looms.getEvents(run.runId)).some(
        (event) => event.type === 'runtime.effect.cancelled',
      ),
    ).toBe(false)

    f.allowStop()
    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.store.get(job.id))?.stopped).toBe(true)

    expect(
      (await f.looms.getEvents(run.runId)).some(
        (event) => event.type === 'runtime.effect.cancelled',
      ),
    ).toBe(true)
  } finally {
    await f.looms.stop()
  }
})

test('lost submission and committed callback responses reconcile without duplicate work', async () => {
  const f = setup()

  try {
    f.loseNextSubmission()
    const run = await f.looms.start(f.definition, {})
    const jobs = await f.store.pending()
    expect(jobs).toHaveLength(1)
    const job = jobs[0]

    if (!job) {
      throw new Error('Missing job')
    }

    await Effect.runPromise(f.bridge.reconcile)
    const instance = 'response-loss-worker-001'
    await f.worker(job.id, 'begin', { instance })

    await f.worker(job.id, 'result', {
      instance,
      outcome: { kind: 'complete', events: [{ type: 'worker.done', payload: {} }] },
    })

    f.loseNextCallback()
    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.store.get(job.id))?.delivery).toBe('pending')
    expect((await f.store.get(job.id))?.stopped).toBe(true)
    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.store.get(job.id))?.delivery).toBe('applied')
    expect((await f.store.get(job.id))?.lastError).toBeNull()

    expect(
      (await f.looms.getEvents(run.runId)).filter((event) => event.type === 'worker.done'),
    ).toHaveLength(1)

    expect(f.launched).toHaveLength(1)
  } finally {
    await f.looms.stop()
  }
})

test('cancellation supersedes a stored result and retries its acknowledgment after an outage', async () => {
  const f = setup()

  try {
    const run = await f.looms.start(f.definition, {})
    const [job] = await f.store.pending()

    if (!job) {
      throw new Error('Missing job')
    }

    await Effect.runPromise(f.bridge.reconcile)
    const instance = 'cancel-result-race-worker'
    expect((await f.worker(job.id, 'begin', { instance })).status).toBe(200)

    expect(
      (
        await f.worker(job.id, 'result', {
          instance,
          outcome: { kind: 'complete', events: [{ type: 'worker.done', payload: {} }] },
        })
      ).status,
    ).toBe(200)

    await f.looms.cancel(run.runId)
    f.blockStop()
    await Effect.runPromise(f.bridge.reconcile)

    expect(
      (await f.looms.getRun(run.runId)).effectExecutions[job.submission.task.effectId]?.status,
    ).toBe('cancel_requested')

    f.allowStop()
    f.rejectCancellation(true)
    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.store.get(job.id))?.stopped).toBe(true)
    expect(await f.store.pending()).toHaveLength(1)

    f.rejectCancellation(false)
    await Effect.runPromise(f.bridge.reconcile)
    expect(await f.store.pending()).toHaveLength(0)
    expect((await f.store.get(job.id))?.delivery).toBe('obsolete')
    const events = await f.looms.getEvents(run.runId)
    expect(events.filter((event) => event.type === 'runtime.effect.cancelled')).toHaveLength(1)
    expect(events.filter((event) => event.type === 'worker.done')).toHaveLength(0)
  } finally {
    await f.looms.stop()
  }
})

test('a retry waits for prior teardown and rejects the prior worker capability', async () => {
  const f = setup()

  try {
    const run = await f.looms.start(f.definition, {})
    const [first] = await f.store.pending()

    if (!first) {
      throw new Error('Missing first attempt')
    }

    await Effect.runPromise(f.bridge.reconcile)
    const instance = 'first-attempt-instance'
    expect((await f.worker(first.id, 'begin', { instance })).status).toBe(200)

    expect(
      (
        await f.worker(first.id, 'result', {
          instance,
          outcome: { kind: 'fail', error: 'retryable failure' },
        })
      ).status,
    ).toBe(200)

    f.blockStop()
    await Effect.runPromise(f.bridge.reconcile)
    await Bun.sleep(5)
    await f.looms.wake(run.runId)
    const retry = (await f.store.siblings(first.logicalKey)).find((job) => job.id !== first.id)

    if (!retry) {
      throw new Error('Missing retry attempt')
    }

    await Effect.runPromise(f.bridge.reconcile)
    expect(f.launched).toEqual([first.id])

    expect((await f.worker(retry.id, 'begin', { instance: 'retry-worker-instance' })).status).toBe(
      425,
    )

    const priorCapability = createHmac('sha256', secret).update(first.id).digest('hex')
    expect((await f.worker(retry.id, 'begin', { instance }, priorCapability)).status).toBe(401)
    expect((await f.worker(first.id, 'heartbeat', { instance })).status).toBe(409)

    f.allowStop()
    await Effect.runPromise(f.bridge.reconcile)
    expect(f.launched).toEqual([first.id, retry.id])
    const secondInstance = 'second-attempt-instance'
    expect((await f.worker(retry.id, 'begin', { instance: secondInstance })).status).toBe(200)

    expect(
      (
        await f.worker(retry.id, 'result', {
          instance: secondInstance,
          outcome: { kind: 'complete', events: [{ type: 'worker.done', payload: {} }] },
        })
      ).status,
    ).toBe(200)

    await Effect.runPromise(f.bridge.reconcile)
    expect((await f.looms.getRun(run.runId)).status).toBe('completed')

    expect(
      (await f.looms.getEvents(run.runId)).filter((event) => event.type === 'worker.done'),
    ).toHaveLength(1)
  } finally {
    await f.looms.stop()
  }
})
