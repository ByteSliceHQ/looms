import { expect, test } from 'bun:test'

import { Schema } from 'effect'

import { AxOutcomeSchema } from './protocol'
import { runAxHandler, type AxHandlerOptions } from './worker-entry'

const assignment = {
  task: { runId: 'run', effectId: 'effect', attempt: 1, type: 'test.work', input: {} },
  idempotencyKey: 'stable-logical-key',
}

const options = {
  endpoint: 'https://bridge.example',
  jobId: 'job',
  token: 'capability',
} satisfies Partial<AxHandlerOptions>

const Receipt = Schema.Struct({ instance: Schema.String, outcome: AxOutcomeSchema })

test('handler receives the stable key and submits one authenticated outcome', async () => {
  const requests: Request[] = []

  await runAxHandler({
    ...options,
    handle: (received) => {
      expect(received).toEqual(assignment)
      return Promise.resolve({ kind: 'complete', events: [{ type: 'test.done', payload: {} }] })
    },
    fetch: (input, init) => {
      const request = new Request(input, init)
      requests.push(request)
      expect(request.headers.get('authorization')).toBe('Bearer capability')
      expect(request.redirect).toBe('manual')
      return Promise.resolve(Response.json(request.url.endsWith('/begin') ? assignment : {}))
    },
  })

  expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
    '/v1/jobs/job/begin',
    '/v1/jobs/job/result',
  ])

  const begin = requests[0]
  const result = requests[1]

  if (!begin || !result) {
    throw new Error('Missing worker requests')
  }

  const receipt = Schema.decodeUnknownSync(Receipt)(await result.json())
  expect(await begin.json()).toEqual({ instance: receipt.instance })

  expect(receipt.outcome).toEqual({
    kind: 'complete',
    events: [{ type: 'test.done', payload: {} }],
  })
})

test('handler exceptions become failure outcomes', async () => {
  let result: Request | undefined

  await runAxHandler({
    ...options,
    handle: () => Promise.reject(new Error('fixture failed')),
    fetch: (input, init) => {
      const request = new Request(input, init)

      if (request.url.endsWith('/result')) {
        result = request
      }

      return Promise.resolve(Response.json(assignment))
    },
  })

  expect(result).toBeDefined()
  const receipt = Schema.decodeUnknownSync(Receipt)(await result?.json())
  expect(receipt.outcome).toEqual({ kind: 'fail', error: 'fixture failed' })
})

test('heartbeat rejection aborts the handler without submitting an outcome', async () => {
  const actions: string[] = []
  let interrupted = false

  const settled = await Promise.allSettled([
    runAxHandler({
      ...options,
      heartbeatMs: 1,
      handle: (_assignment, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => {
              interrupted = true
              reject(new Error('aborted'))
            },
            { once: true },
          )
        }),
      fetch: (input, init) => {
        const request = new Request(input, init)
        actions.push(new URL(request.url).pathname)
        return Promise.resolve(
          request.url.endsWith('/begin')
            ? Response.json(assignment)
            : new Response(null, { status: 409 }),
        )
      },
    }),
  ])

  expect(settled[0]?.status).toBe('rejected')
  expect(interrupted).toBe(true)
  expect(actions).toEqual(['/v1/jobs/job/begin', '/v1/jobs/job/heartbeat'])
})

test('uncertain admission cannot rerun a claimed attempt', async () => {
  let requests = 0
  let executions = 0

  const settled = await Promise.allSettled([
    runAxHandler({
      ...options,
      handle: () => {
        executions += 1
        return Promise.resolve({ kind: 'complete', events: [] })
      },
      fetch: () => {
        requests += 1
        return requests === 1
          ? Promise.reject(new Error('Lost admission response'))
          : Promise.resolve(new Response(null, { status: 409 }))
      },
    }),
  ])

  expect(settled[0]?.status).toBe('rejected')
  expect(requests).toBe(2)
  expect(executions).toBe(0)
})
