import { expect, test } from 'bun:test'

import { axJobId, canonicalJson, logicalEffectKey } from './protocol'
import { createAxWorker } from './worker'

const task = {
  runId: 'run',
  effectId: 'effect',
  attempt: 1,
  type: 'test.work',
  input: { b: 2, a: 1 },
}

test('identity includes scope and attempt, while business identity survives retry', async () => {
  expect(canonicalJson(task.input)).toBe('{"a":1,"b":2}')
  expect(await axJobId('a', task)).not.toBe(await axJobId('b', task))
  expect(await axJobId('a', task)).not.toBe(await axJobId('a', { ...task, attempt: 2 }))
  const retry = { ...task, attempt: 2 }
  expect(await logicalEffectKey('a', task)).toBe(await logicalEffectKey('a', retry))
})

test('retries an uncertain handoff using the identical request and identity', async () => {
  const requests: Request[] = []

  const worker = createAxWorker({
    endpoint: 'https://bridge.example',
    token: 'host',
    scope: 'a',
    callbackTarget: 'app',
    routes: { 'test.work': { profile: 'test-v1' } },
    fetch: (input, init) => {
      requests.push(new Request(input, init))
      return requests.length === 1
        ? Promise.reject(new Error('lost response'))
        : Promise.resolve(Response.json({}))
    },
  })

  await worker.dispatch(task)
  expect(requests).toHaveLength(2)
  expect(requests[0]?.url).toBe(requests[1]?.url)
  expect(await requests[0]?.text()).toBe(await requests[1]?.text())
  expect(requests[0]?.headers.get('authorization')).toBe('Bearer host')
})

test('unknown routes and conflicts cannot launch work or trigger blind retries', async () => {
  let calls = 0

  const worker = createAxWorker({
    endpoint: 'https://bridge.example',
    token: 'host',
    scope: 'a',
    callbackTarget: 'app',
    routes: { 'test.work': { profile: 'test-v1' } },
    fetch: () => {
      calls += 1
      return Promise.resolve(new Response(null, { status: 409 }))
    },
  })

  expect(Promise.resolve(worker.dispatch({ ...task, type: 'unknown' }))).rejects.toThrow(
    'Unregistered',
  )

  expect(calls).toBe(0)
  expect(Promise.resolve(worker.dispatch(task))).rejects.toThrow('409')
  expect(calls).toBe(1)
})

test('requires explicit opt-in for private-cluster HTTP', () => {
  expect(() =>
    createAxWorker({
      endpoint: 'http://bridge',
      token: 'host',
      scope: 'a',
      callbackTarget: 'app',
      routes: {},
    }),
  ).toThrow('HTTPS')
})

test('redirect responses are rejected without forwarding host credentials', async () => {
  let calls = 0

  const worker = createAxWorker({
    endpoint: 'https://bridge.example',
    token: 'host',
    scope: 'a',
    callbackTarget: 'app',
    routes: { 'test.work': { profile: 'test-v1' } },
    fetch: (_input, init) => {
      expect(init?.redirect).toBe('manual')
      calls += 1
      return Promise.resolve(
        new Response(null, { status: 302, headers: { location: 'https://elsewhere.example' } }),
      )
    },
  })

  let rejected = false

  try {
    await worker.dispatch(task)
  } catch {
    rejected = true
  }

  expect(rejected).toBe(true)
  expect(calls).toBe(1)
})
