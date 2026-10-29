import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  RunLauncherTag,
  complete,
  defineEffect,
  defineRuntimeModule,
  defineThread,
  hasEntries,
  invoke,
  makeMemoryEventStore,
  type EventStore,
} from '@looms/core'

import { SecretContextConflictError, StartRunConflictError } from './errors'
import { createLooms } from './looms'
import { authDenied, authAllowed, bearerAuth } from './server'

const SECRET = 'super-secret-token'

const seen = defineEffect({
  type: 'context.seen',
  execute: (_input, ctx) => [
    {
      type: 'context.observed',
      payload: {
        tenant: ctx.attributes.tenant ?? '',
        hasSecret: ctx.secrets.token === SECRET,
      },
      threadId: ctx.threadId,
    },
  ],
})

const seenOnWorker = defineEffect({
  type: 'context.seen',
  execution: 'worker',
  execute: seen.execute,
})

const contextThread = defineThread({
  kind: 'context',
  initialState: () => ({ done: false }),
  step: (state, event) => (event.type === 'context.observed' ? { ...state, done: true } : state),
  effects: (state) => (state.done ? [complete({ ok: true })] : [invoke(seen, {}, 'see')]),
})

const context = { kind: 'context', name: 'context', version: 'v1' }

const launchChild = defineEffect({
  type: 'context.launch',
  execute: (_input, ctx) =>
    Effect.gen(function* () {
      const launcher = yield* RunLauncherTag

      yield* launcher.launch({
        runId: `${ctx.runId}-child`,
        kind: 'context',
        definitionName: 'context',
        input: null,
      })

      return [
        {
          type: 'context.observed',
          payload: { tenant: '', hasSecret: false },
          threadId: ctx.threadId,
        },
      ]
    }),
})

const parentThread = defineThread({
  kind: 'parent',
  initialState: () => ({ launched: false }),
  step: (state, event) =>
    event.type === 'context.observed' ? { ...state, launched: true } : state,
  effects: (state) =>
    state.launched ? [complete({ ok: true })] : [invoke(launchChild, {}, 'launch')],
})

const contextModule = defineRuntimeModule({
  namespace: 'context',
  protocolVersion: '1.0.0',
  threads: { context: contextThread, parent: parentThread },
  effects: { seen, launch: launchChild },
  definitions: [
    { kind: 'context', name: 'context', version: 'v1' },
    { kind: 'parent', name: 'parent', version: 'v1' },
  ],
})

const workerContextThread = defineThread({
  kind: 'context',
  initialState: () => ({ done: false }),
  step: (state, event) => (event.type === 'context.observed' ? { ...state, done: true } : state),
  effects: (state) => (state.done ? [complete({ ok: true })] : [invoke(seenOnWorker, {}, 'see')]),
})

const workerContextModule = defineRuntimeModule({
  namespace: 'context',
  protocolVersion: '1.0.0',
  threads: { context: workerContextThread },
  effects: { seen: seenOnWorker },
  definitions: [{ kind: 'context', name: 'context', version: 'v1' }],
})

function containsSecret(encoded: string): boolean {
  return encoded.includes(SECRET)
}

describe('run attributes and secret context', () => {
  test('records attributes and keeps secrets out of the log, state, and HTTP responses', async () => {
    const dispatched: Array<{ secrets?: { token?: string } }> = []

    const looms = createLooms({
      modules: [workerContextModule],
      worker: { handles: ['context.seen'], dispatch: (task) => dispatched.push(task) },
    })

    const started = await looms.start(context, null, {
      runId: 'run_context',
      attributes: { tenant: 'acme', project: 'billing' },
      secrets: { token: SECRET },
    })

    expect(started.state.attributes).toEqual({ tenant: 'acme', project: 'billing' })
    expect(containsSecret(JSON.stringify(started))).toBe(false)

    const events = await looms.getEvents('run_context')
    const state = await looms.getRun('run_context')
    const summaries = await looms.fetch(new Request('http://looms.test/runs/summaries'))
    const listed = await summaries?.json()

    expect(containsSecret(JSON.stringify(events))).toBe(false)
    expect(containsSecret(JSON.stringify(state))).toBe(false)
    expect(containsSecret(JSON.stringify(listed))).toBe(false)
    expect(state.attributes).toEqual({ tenant: 'acme', project: 'billing' })

    expect(events.find((event) => event.type === 'runtime.run.started')?.payload).toMatchObject({
      attributes: { tenant: 'acme', project: 'billing' },
    })

    const store = await looms.store
    expect(store.runSecrets).toBeDefined()

    if (store.runSecrets) {
      expect(await Effect.runPromise(store.runSecrets.get('run_context'))).toEqual({
        token: SECRET,
      })
    }

    expect(dispatched[0]?.secrets).toEqual({ token: SECRET })
    await looms.stop()
  })

  test('a worker reads the secret context only while its attempt is running', async () => {
    const looms = createLooms({
      modules: [workerContextModule],
      worker: { handles: ['context.seen'], dispatch: () => undefined },
      authorize: bearerAuth({ worker: 'worker-token' }),
    })

    await looms.start(context, null, { runId: 'run_worker', secrets: { token: SECRET } })
    const effectId = (await looms.getRun('run_worker')).outstandingEffects[0]?.effectId ?? ''

    const call = async (path: string, init: { token?: string; body?: string } = {}) => {
      const response = await looms.fetch(
        new Request(
          `http://looms.test/runs/run_worker/effects/${encodeURIComponent(effectId)}/${path}`,
          {
            method: 'POST',
            headers: { authorization: `Bearer ${init.token ?? 'worker-token'}` },
            body: init.body ?? '{}',
          },
        ),
      )

      return { status: response?.status, headers: response?.headers, body: await response?.json() }
    }

    expect((await call('1/secrets')).body).toEqual({ status: 'stale' })
    expect((await call('1/started')).body).toEqual({ status: 'accepted', cancelRequested: false })

    const accepted = await call('1/secrets')
    expect(accepted.body).toEqual({ status: 'accepted', secrets: { token: SECRET } })
    expect(accepted.headers?.get('cache-control')).toBe('no-store')

    expect((await call('1/secrets', { token: 'wrong' })).status).toBe(401)
    expect((await call('2/secrets')).body).toEqual({ status: 'stale' })

    const observed = {
      type: 'context.observed',
      payload: { tenant: '', hasSecret: true },
      threadId: (await looms.getRun('run_worker')).outstandingEffects[0]?.threadId,
    }

    await call('1/complete', { body: JSON.stringify({ events: [observed] }) })

    expect((await looms.getRun('run_worker')).status).toBe('completed')
    expect((await call('1/secrets')).body).toEqual({ status: 'stale' })
    expect(containsSecret(JSON.stringify(await looms.getEvents('run_worker')))).toBe(false)
    await looms.stop()
  })

  test('a different attribute or secret context conflicts without revealing the secret', async () => {
    const looms = createLooms({ modules: [contextModule] })

    await looms.start(context, null, {
      runId: 'run_once',
      idempotencyKey: 'same',
      attributes: { tenant: 'acme' },
      secrets: { token: SECRET },
    })

    const attributeConflict = await looms
      .start(context, null, {
        runId: 'run_once',
        idempotencyKey: 'same',
        attributes: { tenant: 'other' },
        secrets: { token: SECRET },
      })
      .then(
        () => null,
        (error) => error,
      )

    expect(attributeConflict).toBeInstanceOf(StartRunConflictError)

    const secretConflict = await looms
      .start(context, null, {
        runId: 'run_once',
        idempotencyKey: 'same',
        attributes: { tenant: 'acme' },
        secrets: { token: 'rotated' },
      })
      .then(
        () => null,
        (error) => error,
      )

    expect(secretConflict).toBeInstanceOf(SecretContextConflictError)
    expect(containsSecret(JSON.stringify(secretConflict))).toBe(false)
    expect(JSON.stringify(secretConflict)).not.toContain('rotated')

    const retried = await looms.start(context, null, {
      runId: 'run_once',
      idempotencyKey: 'same',
      attributes: { tenant: 'acme' },
    })

    expect(retried.runId).toBe('run_once')

    const store = await looms.store

    if (store.runSecrets) {
      expect(await Effect.runPromise(store.runSecrets.get('run_once'))).toEqual({ token: SECRET })
    }

    await looms.stop()
  })

  test('authorization sees attributes from the stored run and the start body', async () => {
    const decisions: Array<{ attributes?: { tenant?: string } }> = []

    const looms = createLooms({
      modules: [contextModule],
      authorize: (_request, route) =>
        Effect.sync(() => {
          decisions.push(route)
          return route.attributes?.tenant === 'acme' ? authAllowed : authDenied(403, 'Forbidden')
        }),
    })

    const started = await looms.fetch(
      new Request('http://looms.test/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'context',
          definitionName: 'context',
          runId: 'run_auth',
          attributes: { tenant: 'acme' },
        }),
      }),
    )

    expect(started?.status).toBe(200)

    const read = await looms.fetch(new Request('http://looms.test/runs/run_auth'))
    expect(read?.status).toBe(200)
    expect(decisions.some((route) => route.attributes?.tenant === 'acme')).toBe(true)
    await looms.stop()
  })

  test('authorization reads only the start event to find attributes', async () => {
    const memory = await Effect.runPromise(makeMemoryEventStore)
    let fullReads = 0

    const store: EventStore = {
      ...memory,
      read: (runId, options) => {
        if (options?.limit !== 1) {
          fullReads += 1
        }

        return memory.read(runId, options)
      },
    }

    const readsAtDecision: number[] = []

    const looms = createLooms({
      modules: [contextModule],
      store,
      authorize: (_request, route) =>
        Effect.sync(() => {
          if (route.name === 'runs.get') {
            readsAtDecision.push(fullReads)
          }

          return route.attributes?.tenant === 'acme' ? authAllowed : authDenied(403, 'Forbidden')
        }),
    })

    await looms.start(context, null, { runId: 'run_cheap_auth', attributes: { tenant: 'acme' } })
    fullReads = 0

    const read = await looms.fetch(new Request('http://looms.test/runs/run_cheap_auth'))

    expect(read?.status).toBe(200)
    expect(readsAtDecision).toEqual([0])
    await looms.stop()
  })

  test('a launched run and a fork inherit attributes and secrets without logging them', async () => {
    const looms = createLooms({ modules: [contextModule] })

    await looms.start({ kind: 'parent', name: 'parent', version: 'v1' }, null, {
      runId: 'run_parent',
      attributes: { tenant: 'acme' },
      secrets: { token: SECRET },
    })

    const deadline = Date.now() + 5_000

    while ((await looms.getRun('run_parent-child')).rootThreadId === null) {
      if (Date.now() > deadline) {
        throw new Error('the child run did not start')
      }

      await Bun.sleep(5)
    }

    const child = await looms.getRun('run_parent-child')
    const childEvents = await looms.getEvents('run_parent-child')
    expect(child.attributes).toEqual({ tenant: 'acme' })
    expect(containsSecret(JSON.stringify(childEvents))).toBe(false)

    const store = await looms.store

    if (store.runSecrets) {
      expect(await Effect.runPromise(store.runSecrets.get('run_parent-child'))).toEqual({
        token: SECRET,
      })
    }

    const finished = Date.now() + 5_000

    while ((await looms.getRun('run_parent')).status !== 'completed') {
      if (Date.now() > finished) {
        throw new Error('the parent run did not complete')
      }

      await Bun.sleep(5)
    }

    const forked = await looms.fork('run_parent', { runId: 'run_fork' })
    expect(forked.state.attributes).toEqual({ tenant: 'acme' })
    expect(containsSecret(JSON.stringify(await looms.getEvents('run_fork')))).toBe(false)

    if (store.runSecrets) {
      expect(hasEntries(await Effect.runPromise(store.runSecrets.get('run_fork')))).toBe(true)
      expect(await Effect.runPromise(store.runSecrets.get('run_fork'))).toEqual({ token: SECRET })
    }

    await looms.stop()
  })
})
