import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  RunLauncherTag,
  complete,
  defineEffect,
  defineRuntimeModule,
  defineThread,
  invoke,
  type SecretContext,
} from '@looms/core'

import { createLooms, type Looms } from './looms'
import type { RuntimeObservation } from './observer'
import type { SecretProvider } from './run-secrets'
import { secretSealer } from './secret-sealer'
import { bearerAuth } from './server'

/** What a run holds. No attempt, event, snapshot, or response may ever contain it. */
const HELD = 'held-canary-9f2c1e'
const SEALING_KEY = 'a-sealing-key-of-at-least-32-characters'

/** What local attempts were handed, in order. */
let received: SecretContext[] = []

const use = defineEffect({
  type: 'secrets.use',
  placement: 'local',
  retry: { maxAttempts: 3, backoffMs: 1 },
  execute: (_input, ctx) => {
    received.push(ctx.secrets)
    return [{ type: 'secrets.used', payload: {}, threadId: ctx.threadId }]
  },
})

const useOnWorker = defineEffect({ type: 'secrets.use', placement: 'worker' })

/** Launches a child run. Run ids that end in `explicit` pass the child its secrets themselves. */
const launch = defineEffect({
  type: 'secrets.launch',
  placement: 'local',
  execute: (_input, ctx) =>
    Effect.gen(function* () {
      const launcher = yield* RunLauncherTag

      yield* launcher.launch({
        runId: `${ctx.runId}-child`,
        kind: 'twice',
        definitionName: 'twice',
        input: null,
        secrets: ctx.runId.endsWith('explicit') ? { root: 'explicit' } : undefined,
      })

      return [{ type: 'secrets.used', payload: {}, threadId: ctx.threadId }]
    }),
})

/** Runs the effect twice, one attempt after the other, then completes. */
const twice = defineThread({
  kind: 'twice',
  initialState: () => ({ used: 0 }),
  step: (state, event) => (event.type === 'secrets.used' ? { used: state.used + 1 } : state),
  effects: (state) =>
    state.used < 2 ? [invoke(use, {}, `use-${state.used}`)] : [complete({ ok: true })],
})

const parent = defineThread({
  kind: 'parent',
  initialState: () => ({ used: 0 }),
  step: (state, event) => (event.type === 'secrets.used' ? { used: state.used + 1 } : state),
  effects: (state) => (state.used < 1 ? [invoke(launch, {}, 'launch')] : [complete({ ok: true })]),
})

const definitions = [
  { kind: 'twice', name: 'twice', version: 'v1' },
  { kind: 'parent', name: 'parent', version: 'v1' },
]

const localModule = defineRuntimeModule({
  namespace: 'secrets',
  protocolVersion: '1.0.0',
  threads: { twice, parent },
  effects: { use, launch },
  definitions,
})

const workerModule = defineRuntimeModule({
  namespace: 'secrets',
  protocolVersion: '1.0.0',
  threads: { twice },
  effects: { use: useOnWorker },
  definitions: [definitions[0]!],
})

const twiceRun = definitions[0]!
const parentRun = definitions[1]!

async function until(check: () => Promise<boolean>, what: string): Promise<void> {
  const deadline = Date.now() + 5_000

  while (!(await check())) {
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting until ${what}`)
    }

    await Bun.sleep(2)
  }
}

async function stored(looms: Looms, runId: string): Promise<SecretContext> {
  const store = await looms.store
  return store.runSecrets ? Effect.runPromise(store.runSecrets.get(runId)) : {}
}

/** Starts the run's first outstanding attempt as a worker would, then asks for its secrets. */
async function workerSecrets(looms: Looms, runId: string) {
  const effectId = (await looms.getRun(runId)).outstandingEffects[0]?.effectId ?? ''

  const call = async (action: string) => {
    const response = await looms.fetch(
      new Request(
        `http://looms.test/runs/${runId}/effects/${encodeURIComponent(effectId)}/1/${action}`,
        { method: 'POST', headers: { authorization: 'Bearer worker-token' }, body: '{}' },
      ),
    )

    return { body: await response?.json() }
  }

  await call('started')
  return (await call('secrets')).body
}

/** The message a sealer refused with, or `opened`. */
const refused = (attempt: Effect.Effect<SecretContext, Error>) =>
  Effect.runPromise(
    attempt.pipe(Effect.match({ onFailure: (error) => error.message, onSuccess: () => 'opened' })),
  )

const completed = (looms: Looms, runId: string) =>
  until(async () => (await looms.getRun(runId)).status === 'completed', `${runId} completes`)

const released = (looms: Looms, runId: string) =>
  until(
    async () => Object.keys(await stored(looms, runId)).length === 0,
    `${runId} holds no secrets`,
  )

/** The effect types a provider was asked about. */
let askedAbout: string[] = []

/** Hands each attempt a credential that names the attempt, and never the held one. */
const narrowing: SecretProvider = {
  provision: ({ supplied }) => ({ root: `${HELD}:${supplied.tenant ?? ''}` }),
  forAttempt: ({ held, attempt }) => {
    askedAbout.push(attempt.type)

    return {
      secrets: {
        token: `attempt:${attempt.effectId}:${attempt.attempt}:${held.root?.length ?? 0}`,
      },
    }
  },
}

describe('secret provider', () => {
  test('each attempt receives what the provider decides and never what the run holds', async () => {
    received = []
    askedAbout = []
    const looms = createLooms({ modules: [localModule], secretProvider: narrowing })

    const started = await looms.start(twiceRun, null, {
      runId: 'run_narrow',
      secrets: { tenant: 'acme' },
    })

    await completed(looms, started.runId)

    expect(received).toHaveLength(2)
    expect(received[0]?.token).toMatch(/^attempt:.+:1:\d+$/)
    expect(received[0]?.token).not.toBe(received[1]?.token)
    expect(JSON.stringify(received)).not.toContain(HELD)
    // The runtime's own effects, such as the one that completes the thread, are not asked about.
    expect(askedAbout).toEqual(['secrets.use', 'secrets.use'])
    await looms.stop()
  })

  test('a provider can replace what the run holds, and the next attempt sees it', async () => {
    received = []
    let fetched = 0

    const looms = createLooms({
      modules: [localModule],
      secretProvider: {
        // Fetch on first use, then reuse what is held.
        forAttempt: ({ held }) => {
          if (held.root !== undefined) {
            return { secrets: { token: `from:${held.root}` } }
          }

          fetched += 1
          return { secrets: { token: 'from:fetched-1' }, hold: { root: 'fetched-1' } }
        },
      },
    })

    await looms.start(twiceRun, null, { runId: 'run_hold' })
    await completed(looms, 'run_hold')

    expect(fetched).toBe(1)
    expect(received.map((secrets) => secrets.token)).toEqual(['from:fetched-1', 'from:fetched-1'])
    await looms.stop()
  })

  test('a provider failure fails the attempt, is retried, and never reaches the log', async () => {
    received = []
    let calls = 0
    const observed: RuntimeObservation[] = []

    const looms = createLooms({
      modules: [localModule],
      observer: { observe: (event) => void observed.push(event) },
      secretProvider: {
        forAttempt: () => {
          calls += 1

          if (calls === 1) {
            throw new Error(`the vault refused ${HELD}`)
          }

          return { secrets: { token: 'ok' } }
        },
      },
    })

    await looms.start(twiceRun, null, { runId: 'run_fail' })
    await completed(looms, 'run_fail')

    const events = await looms.getEvents('run_fail')
    const log = JSON.stringify(events)

    expect(log).toContain('secrets are unavailable for this attempt')
    expect(log).not.toContain(HELD)
    expect(received.map((secrets) => secrets.token)).toEqual(['ok', 'ok'])

    expect(observed.find((event) => event.type === 'secrets.failed')).toMatchObject({
      step: 'forAttempt',
      detail: `the vault refused ${HELD}`,
    })

    const issued = observed.filter((event) => event.type === 'secrets.issued')
    expect(issued.length).toBeGreaterThan(0)
    expect(issued.every((event) => event.names.join() === 'token')).toBe(true)
    await looms.stop()
  })

  test('a worker is given its own attempt, and told when the provider cannot answer', async () => {
    let fail = false

    const looms = createLooms({
      modules: [workerModule],
      worker: { handles: ['secrets.use'], dispatch: () => undefined },
      authorize: bearerAuth({ worker: 'worker-token' }),
      secretProvider: {
        ...narrowing,
        forAttempt: (input) => {
          if (fail) {
            throw new Error('down')
          }

          return narrowing.forAttempt!(input)
        },
      },
    })

    await looms.start(twiceRun, null, { runId: 'run_worker', secrets: { tenant: 'acme' } })
    const effectId = (await looms.getRun('run_worker')).outstandingEffects[0]?.effectId ?? ''

    const call = async (path: string) => {
      const response = await looms.fetch(
        new Request(
          `http://looms.test/runs/run_worker/effects/${encodeURIComponent(effectId)}/${path}`,
          { method: 'POST', headers: { authorization: 'Bearer worker-token' }, body: '{}' },
        ),
      )

      return response?.json()
    }

    await call('1/started')

    expect(await call('1/secrets')).toEqual({
      status: 'accepted',
      secrets: { token: `attempt:${effectId}:1:${`${HELD}:acme`.length}` },
    })

    fail = true
    expect(await call('1/secrets')).toEqual({ status: 'unavailable' })
    await looms.stop()
  })

  test('what a run holds is revoked and deleted when it finishes, and never put back', async () => {
    received = []
    const revoked: SecretContext[] = []
    let provisioned = 0

    const looms = createLooms({
      modules: [localModule],
      secretProvider: {
        provision: () => {
          provisioned += 1
          return { root: HELD }
        },
        revoke: ({ held }) => {
          revoked.push(held)
          throw new Error('the revocation endpoint is down')
        },
      },
    })

    await looms.start(twiceRun, null, { runId: 'run_done', idempotencyKey: 'once' })
    await completed(looms, 'run_done')
    await released(looms, 'run_done')

    // A failed revocation does not keep the secrets at rest.
    expect(revoked).toEqual([{ root: HELD }])

    await looms.start(twiceRun, null, { runId: 'run_done', idempotencyKey: 'once' })
    expect(provisioned).toBe(1)
    expect(await stored(looms, 'run_done')).toEqual({})
    await looms.stop()
  })

  test('a launched run is supplied by the provider, or by the launch when it passes secrets', async () => {
    received = []
    const asked: string[] = []

    const looms = createLooms({
      modules: [localModule],
      secretProvider: {
        forChild: ({ held, child }) => {
          asked.push(`${child.relation}:${child.runId}:${held.root ?? ''}`)
          return { root: `for-${child.runId}` }
        },
        forAttempt: ({ held }) => ({ secrets: { token: held.root ?? 'none' } }),
      },
    })

    await looms.start(parentRun, null, { runId: 'run_a', secrets: { root: 'parent' } })
    await completed(looms, 'run_a-child')

    await looms.start(parentRun, null, { runId: 'run_explicit', secrets: { root: 'parent' } })
    await completed(looms, 'run_explicit-child')

    expect(asked).toEqual(['launch:run_a-child:parent'])

    expect(received.map((secrets) => secrets.token)).toEqual([
      'for-run_a-child',
      'for-run_a-child',
      'explicit',
      'explicit',
    ])

    await looms.stop()
  })

  test('a fork holds the secrets it is given, or what the provider decides', async () => {
    received = []
    const calls: string[] = []

    const looms = createLooms({
      modules: [localModule],
      secretProvider: {
        forChild: ({ held, child }) => {
          calls.push(`${child.relation}:${Object.keys(held).length}`)
          return { root: 'from-provider' }
        },
        provision: ({ run, supplied }) => {
          calls.push(`provision:${run.runId}:${supplied.root ?? ''}`)
          return supplied
        },
      },
    })

    await looms.start(twiceRun, null, { runId: 'run_src', secrets: { root: 'source' } })
    await completed(looms, 'run_src')
    await released(looms, 'run_src')

    await looms.fork('run_src', { runId: 'run_fork_a' })
    await looms.fork('run_src', { runId: 'run_fork_b', secrets: { root: 'given' } })

    // The source finished, so it holds nothing for the provider to pass on (`fork:0`), and a
    // fork that is given secrets does not ask the provider.
    expect(calls).toEqual([
      'provision:run_src:source',
      'fork:0',
      'provision:run_fork_a:from-provider',
      'provision:run_fork_b:given',
    ])

    await looms.stop()
  })
})

describe('sealed secrets', () => {
  test('what a run holds is stored sealed, and attempts still receive their secrets', async () => {
    received = []

    const looms = createLooms({
      modules: [workerModule],
      worker: { handles: ['secrets.use'], dispatch: () => undefined },
      authorize: bearerAuth({ worker: 'worker-token' }),
      secretSealer: secretSealer({ key: SEALING_KEY }),
      secretProvider: {
        forAttempt: ({ held }) => ({ secrets: { token: `narrowed:${held.root?.length ?? 0}` } }),
      },
    })

    await looms.start(twiceRun, null, { runId: 'run_sealed', secrets: { root: HELD } })

    const atRest = await stored(looms, 'run_sealed')
    expect(Object.keys(atRest)).toEqual(['looms.sealed'])
    expect(JSON.stringify(atRest)).not.toContain(HELD)

    expect(await workerSecrets(looms, 'run_sealed')).toEqual({
      status: 'accepted',
      secrets: { token: `narrowed:${HELD.length}` },
    })

    await looms.stop()
  })

  test('a record opens only for its own run, and old keys keep opening old records', async () => {
    const first = secretSealer({ key: SEALING_KEY })
    const rotated = secretSealer({ key: `${SEALING_KEY}-next`, previousKeys: [SEALING_KEY] })
    const unrelated = secretSealer({ key: `${SEALING_KEY}-other` })

    const sealed = await Effect.runPromise(first.seal('run_a', { root: HELD }))
    expect(sealed).not.toContain(HELD)
    expect(await Effect.runPromise(first.seal('run_a', { root: HELD }))).not.toBe(sealed)

    expect(await Effect.runPromise(first.open('run_a', sealed))).toEqual({ root: HELD })
    expect(await Effect.runPromise(rotated.open('run_a', sealed))).toEqual({ root: HELD })

    const resealed = await Effect.runPromise(rotated.seal('run_a', { root: HELD }))
    expect(resealed.split('.')[1]).not.toBe(sealed.split('.')[1])

    const wrongRunOrKey = 'The sealed record does not open for this run with this key'
    expect(await refused(first.open('run_b', sealed))).toBe(wrongRunOrKey)
    expect(await refused(first.open('run_a', `${sealed.slice(0, -2)}AA`))).toBe(wrongRunOrKey)

    expect(await refused(unrelated.open('run_a', sealed))).toBe(
      'The sealed record was sealed with a key this runtime does not have',
    )

    expect(await refused(first.open('run_a', 'not-a-record'))).toBe(
      'The sealed record is malformed',
    )

    expect(() => secretSealer({ key: 'too-short' })).toThrow()
  })

  test('secrets stored before sealing was turned on are still read', async () => {
    const plain = createLooms({
      modules: [workerModule],
      worker: { handles: ['secrets.use'], dispatch: () => undefined },
    })

    await plain.start(twiceRun, null, { runId: 'run_plain', secrets: { token: 'older' } })

    const sealing = createLooms({
      modules: [workerModule],
      store: await plain.store,
      worker: { handles: ['secrets.use'], dispatch: () => undefined },
      authorize: bearerAuth({ worker: 'worker-token' }),
      secretSealer: secretSealer({ key: SEALING_KEY }),
    })

    expect(await workerSecrets(sealing, 'run_plain')).toEqual({
      status: 'accepted',
      secrets: { token: 'older' },
    })

    await sealing.stop()
    await plain.stop()
  })

  test('a secret cannot use the name sealed records are stored under', async () => {
    const looms = createLooms({ modules: [localModule] })

    const rejected = await looms
      .start(twiceRun, null, { runId: 'run_name', secrets: { 'looms.sealed': 'x' } })
      .then(
        () => null,
        (error) => error,
      )

    expect(rejected).toBeInstanceOf(Error)
    expect((await looms.getEvents('run_name')).length).toBe(0)
    await looms.stop()
  })
})

describe('what a run holds never leaves the secret store', () => {
  test('it is in no event, state, response, dispatched task, or stored record', async () => {
    const dispatched: unknown[] = []
    const observed: RuntimeObservation[] = []

    const looms = createLooms({
      modules: [workerModule],
      worker: { handles: ['secrets.use'], dispatch: (task) => void dispatched.push(task) },
      authorize: bearerAuth({ worker: 'worker-token', operations: 'ops-token' }),
      observer: { observe: (event) => void observed.push(event) },
      secretSealer: secretSealer({ key: SEALING_KEY }),
      secretProvider: narrowing,
    })

    const started = await looms.start(twiceRun, null, {
      runId: 'run_scan',
      secrets: { tenant: 'acme' },
    })

    const seen: unknown[] = [started, dispatched, observed]

    const get = async (path: string, token?: string) => {
      const response = await looms.fetch(
        new Request(`http://looms.test${path}`, {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        }),
      )

      seen.push(await response?.text())
    }

    const callback = async (effectId: string, attempt: number, action: string, body = '{}') => {
      const response = await looms.fetch(
        new Request(
          `http://looms.test/runs/run_scan/effects/${encodeURIComponent(effectId)}/${attempt}/${action}`,
          { method: 'POST', headers: { authorization: 'Bearer worker-token' }, body },
        ),
      )

      const text = await response?.text()
      seen.push(text)
      return text
    }

    for (let step = 0; step < 2; step += 1) {
      const item = (await looms.getRun('run_scan')).outstandingEffects[0]
      const effectId = item?.effectId ?? ''

      await callback(effectId, 1, 'started')
      expect(await callback(effectId, 1, 'secrets')).toContain('attempt:')

      await callback(
        effectId,
        1,
        'complete',
        JSON.stringify({
          events: [{ type: 'secrets.used', payload: {}, threadId: item?.threadId }],
        }),
      )

      seen.push(await stored(looms, 'run_scan'))
    }

    await completed(looms, 'run_scan')
    await released(looms, 'run_scan')

    seen.push(await looms.getEvents('run_scan'), await looms.getRun('run_scan'))
    await get('/runs/run_scan')
    await get('/runs/run_scan/events')
    await get('/runs/summaries')
    await get('/runs/run_scan/effects', 'ops-token')

    const store = await looms.store
    seen.push(await Effect.runPromise(store.read('run_scan')))

    // The provider held `${HELD}:acme` for the run. Nothing a reader can reach contains it.
    expect(JSON.stringify(seen)).not.toContain(HELD)
    expect(JSON.stringify(seen)).toContain('attempt:')
    await looms.stop()
  })
})
