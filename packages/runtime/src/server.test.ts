import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import {
  DefinitionCatalogSchema,
  defineEventCatalog,
  defineModule,
  RunSummariesSchema,
} from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'
import { authAllowed, authDenied, bearerAuth, type RouteInfo } from './server'

const decodeRunResponse = Schema.decodeUnknownSync(
  Schema.Struct({
    runId: Schema.String,
    state: Schema.Struct({ status: Schema.String }),
  }),
)

const decodeValidationError = Schema.decodeUnknownSync(
  Schema.Struct({
    error: Schema.String,
    issues: Schema.Array(Schema.Unknown),
  }),
)

describe('server HTTP idempotency', () => {
  test('POST /runs accepts idempotencyKey in body and deduplicates', async () => {
    let runCount = 0

    const flow = defineWorkflow({
      name: 'flow-body-idempotent',
      nodes: [
        {
          id: 'step1',
          run: () => {
            runCount += 1
            return { ok: true }
          },
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [flow] })],
    })

    const runId = 'run_http_body_idem'
    const idempotencyKey = 'idem_body_123'

    const req1 = new Request('http://looms.test/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'workflow',
        definitionName: 'flow-body-idempotent',
        runId,
        idempotencyKey,
      }),
    })

    const res1 = await looms.fetch(req1)
    expect(res1?.status).toBe(200)
    const json1 = decodeRunResponse(await res1?.json())
    expect(json1.runId).toBe(runId)
    expect(json1.state.status).toBe('completed')
    expect(runCount).toBe(1)

    // Repeat identical request with same idempotencyKey
    const req2 = new Request('http://looms.test/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'workflow',
        definitionName: 'flow-body-idempotent',
        runId,
        idempotencyKey,
      }),
    })

    const res2 = await looms.fetch(req2)
    expect(res2?.status).toBe(200)
    const json2 = decodeRunResponse(await res2?.json())
    expect(json2.runId).toBe(runId)
    expect(json2.state.status).toBe('completed')
    expect(runCount).toBe(1)

    const events = await looms.getEvents(runId)
    const startEvents = events.filter((e) => e.type === 'runtime.run.started')
    expect(startEvents).toHaveLength(1)
    expect(startEvents[0]?.idempotencyKey).toBe(idempotencyKey)
    await looms.stop()
  })

  test('POST /runs reads Idempotency-Key and x-idempotency-key headers', async () => {
    let runCount = 0

    const flow = defineWorkflow({
      name: 'flow-header-idempotent',
      nodes: [
        {
          id: 'step1',
          run: () => {
            runCount += 1
            return { ok: true }
          },
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [flow] })],
    })

    const runId = 'run_http_header_idem'
    const idempotencyKey = 'idem_header_abc'

    const req1 = new Request('http://looms.test/runs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        kind: 'workflow',
        definitionName: 'flow-header-idempotent',
        runId,
      }),
    })

    const res1 = await looms.fetch(req1)
    expect(res1?.status).toBe(200)
    const json1 = decodeRunResponse(await res1?.json())
    expect(json1.runId).toBe(runId)
    expect(json1.state.status).toBe('completed')
    expect(runCount).toBe(1)

    // Second request with x-idempotency-key header
    const req2 = new Request('http://looms.test/runs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({
        kind: 'workflow',
        definitionName: 'flow-header-idempotent',
        runId,
      }),
    })

    const res2 = await looms.fetch(req2)
    expect(res2?.status).toBe(200)
    const json2 = decodeRunResponse(await res2?.json())
    expect(json2.runId).toBe(runId)
    expect(runCount).toBe(1)

    const events = await looms.getEvents(runId)
    const startEvents = events.filter((e) => e.type === 'runtime.run.started')
    expect(startEvents).toHaveLength(1)
    expect(startEvents[0]?.idempotencyKey).toBe(idempotencyKey)
    await looms.stop()
  })

  test('POST /runs/:id/events deduplicates signals with identical idempotencyKey', async () => {
    const flow = defineWorkflow({
      name: 'signal-flow',
      nodes: [
        {
          id: 'step1',
          run: () => ({ ok: true }),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [flow] })],
    })

    const { runId } = await looms.start(flow, {})

    const signalKey = 'signal_key_999'

    const req1 = new Request(`http://looms.test/runs/${runId}/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': signalKey,
      },
      body: JSON.stringify({
        type: 'custom.signal',
        payload: { note: 'first' },
      }),
    })

    const res1 = await looms.fetch(req1)
    expect(res1?.status).toBe(200)

    // Repeat signal with same key
    const req2 = new Request(`http://looms.test/runs/${runId}/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': signalKey,
      },
      body: JSON.stringify({
        type: 'custom.signal',
        payload: { note: 'second-duplicate' },
      }),
    })

    const res2 = await looms.fetch(req2)
    expect(res2?.status).toBe(200)

    const events = await looms.getEvents(runId)
    const customSignals = events.filter((e) => e.type === 'custom.signal')
    expect(customSignals).toHaveLength(1)
    expect(customSignals[0]?.idempotencyKey).toBe(signalKey)
    await looms.stop()
  })

  test('POST /runs/:id/events returns 400 when event payload fails catalog schema', async () => {
    const catalog = defineEventCatalog('billing', {
      invoice: Schema.Struct({
        amount: Schema.Finite,
      }),
    })

    const billingModule = defineModule(
      {
        namespace: 'billing',
        protocolVersion: '1.0.0',
        events: catalog,
      },
      () => ({}),
    )

    const flow = defineWorkflow({
      name: 'billing-flow',
      nodes: [
        {
          id: 'step1',
          run: () => ({ ok: true }),
        },
      ],
    })

    const looms = createLooms({
      modules: [workflow({ definitions: [flow] }), billingModule],
    })

    const { runId } = await looms.start(flow, {})

    const req = new Request(`http://looms.test/runs/${runId}/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        type: 'billing.invoice',
        payload: { amount: 'not-a-number' },
      }),
    })

    const res = await looms.fetch(req)
    expect(res?.status).toBe(400)
    const json = decodeValidationError(await res?.json())
    expect(json.error).toContain('Invalid payload for event "billing.invoice"')
    expect(json.issues.length).toBeGreaterThan(0)
    await looms.stop()
  })

  test('POST /runs returns 400 for malformed JSON', async () => {
    const looms = createLooms({ modules: [] })

    const response = await looms.fetch(
      new Request('http://looms.test/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
    )

    expect(response?.status).toBe(400)
    expect(await response?.json()).toEqual({ error: 'Invalid JSON request body' })
    await looms.stop()
  })
})

describe('server routing', () => {
  test('routes system endpoints and distinguishes passthrough from API 404s', async () => {
    const looms = createLooms({ modules: [] })

    const health = await looms.fetch(new Request('http://looms.test/health'))
    const runs = await looms.fetch(new Request('http://looms.test/runs'))

    const unknownApiRoute = await looms.fetch(new Request('http://looms.test/runs/run_1/unknown'))

    const nonApiRoute = await looms.fetch(new Request('http://looms.test/application'))

    expect(health?.status).toBe(200)
    expect(await health?.json()).toEqual({ ok: true })
    expect(runs?.status).toBe(200)
    expect(await runs?.json()).toEqual({ runIds: [] })
    expect(unknownApiRoute?.status).toBe(404)
    expect(await unknownApiRoute?.text()).toBe('Not Found')
    expect(nonApiRoute).toBeNull()
    await looms.stop()
  })

  test('centralizes operations endpoint configuration and authorization', async () => {
    const unconfigured = createLooms({ modules: [] })

    const configured = createLooms({
      modules: [],
      authorize: bearerAuth({ operations: 'operations-secret' }),
    })

    const url = 'http://looms.test/operations/deadlines/rescan'

    const unavailable = await unconfigured.fetch(new Request(url, { method: 'POST' }))
    const unauthorized = await configured.fetch(new Request(url, { method: 'POST' }))

    const authorized = await configured.fetch(
      new Request(url, {
        method: 'POST',
        headers: { authorization: 'Bearer operations-secret' },
      }),
    )

    expect(unavailable?.status).toBe(503)

    expect(await unavailable?.json()).toEqual({
      error: 'Operational endpoints are not configured',
    })

    expect(unauthorized?.status).toBe(401)
    expect(authorized?.status).toBe(200)
    expect(await authorized?.json()).toEqual({ scheduled: 0 })
    await unconfigured.stop()
    await configured.stop()
  })

  test('passes route access, name and run id to a custom authorize hook', async () => {
    const seen: RouteInfo[] = []

    const looms = createLooms({
      modules: [],
      authorize: (request, route) =>
        Effect.sync(() => {
          seen.push(route)

          return request.headers.get('x-tenant') === 'acme'
            ? authAllowed
            : authDenied(403, 'Forbidden')
        }),
    })

    const denied = await looms.fetch(new Request('http://looms.test/runs/run_1/status'))

    const allowed = await looms.fetch(
      new Request('http://looms.test/runs/run_1/events', { headers: { 'x-tenant': 'acme' } }),
    )

    const health = await looms.fetch(new Request('http://looms.test/health'))

    expect(denied?.status).toBe(403)
    expect(await denied?.json()).toEqual({ error: 'Forbidden' })
    expect(allowed?.status).toBe(200)
    expect(health?.status).toBe(200)

    expect(seen).toEqual([
      { access: 'read', name: 'runs.status', runId: 'run_1' },
      { access: 'read', name: 'runs.events', runId: 'run_1' },
    ])

    await looms.stop()
  })

  test('bearerAuth protects reads and writes only when given a token', async () => {
    const looms = createLooms({ modules: [], authorize: bearerAuth({ read: 'reader' }) })

    const anonymousRead = await looms.fetch(new Request('http://looms.test/runs'))

    const tokenRead = await looms.fetch(
      new Request('http://looms.test/runs', { headers: { authorization: 'Bearer reader' } }),
    )

    const anonymousWrite = await looms.fetch(
      new Request('http://looms.test/runs/run_1/wake', { method: 'POST' }),
    )

    const worker = await looms.fetch(
      new Request('http://looms.test/runs/run_1/effects/eff_1/1/started', { method: 'POST' }),
    )

    expect(anonymousRead?.status).toBe(401)
    expect(tokenRead?.status).toBe(200)
    expect(anonymousWrite?.status).toBe(200)
    expect(worker?.status).toBe(503)
    await looms.stop()
  })

  test('GET /definitions lists registered definitions and projections', async () => {
    const flow = defineWorkflow({
      name: 'checkout',
      description: 'Charge after review',
      input: Schema.Struct({ amount: Schema.Finite }),
      nodes: [{ id: 'step', run: () => null }],
    })

    const looms = createLooms({ modules: [workflow({ definitions: [flow] })] })

    const response = await looms.fetch(new Request('http://looms.test/definitions'))
    const body = Schema.decodeUnknownSync(DefinitionCatalogSchema)(await response?.json())

    expect(response?.status).toBe(200)

    expect(body.definitions).toEqual([
      {
        kind: 'workflow',
        name: 'checkout',
        version: 'v1',
        description: 'Charge after review',
        inputSchema: body.definitions[0]?.inputSchema,
      },
    ])

    expect(body.definitions[0]?.inputSchema).toMatchObject({ type: 'object' })
    expect(body.projections).toContain('nodes')
    await looms.stop()
  })

  test('GET /runs/summaries lists each run with its status and definition', async () => {
    const flow = defineWorkflow({ name: 'summarized', nodes: [{ id: 'step', run: () => null }] })
    const looms = createLooms({ modules: [workflow({ definitions: [flow] })] })
    const started = await looms.start(flow, null)

    const plain = await looms.fetch(new Request('http://looms.test/runs'))
    const summarized = await looms.fetch(new Request('http://looms.test/runs/summaries'))
    const body = Schema.decodeUnknownSync(RunSummariesSchema)(await summarized?.json())

    expect(await plain?.json()).toEqual({ runIds: [started.runId] })

    expect(body.runs).toEqual([
      {
        runId: started.runId,
        status: 'completed',
        kind: 'workflow',
        definitionName: 'summarized',
      },
    ])

    await looms.stop()
  })

  test('serves a debugger under its base path after read authorization', async () => {
    const seen: RouteInfo[] = []

    const looms = createLooms({
      modules: [],
      authorize: (request, route) =>
        Effect.sync(() => {
          if (route.name === 'debugger') {
            seen.push(route)
          }

          return request.headers.get('x-allow') === 'yes'
            ? authAllowed
            : authDenied(403, 'Forbidden')
        }),
      debugger: {
        basePath: '/debugger/',
        fetch: (_request, mount) =>
          Promise.resolve(
            new Response(`${mount.basePath} ${mount.path}`, {
              headers: { 'content-type': 'text/html' },
            }),
          ),
      },
    })

    const denied = await looms.fetch(
      new Request('http://looms.test/debugger', { headers: { accept: 'text/html' } }),
    )

    const page = await looms.fetch(
      new Request('http://looms.test/debugger/runs', {
        headers: { accept: 'text/html', 'x-allow': 'yes' },
      }),
    )

    const health = await looms.fetch(
      new Request('http://looms.test/health', { headers: { 'x-allow': 'yes' } }),
    )

    const outside = await looms.fetch(
      new Request('http://looms.test/debugger-other', { headers: { 'x-allow': 'yes' } }),
    )

    expect(denied?.status).toBe(403)
    expect(await denied?.json()).toEqual({ error: 'Forbidden' })
    expect(page?.status).toBe(200)
    expect(await page?.text()).toBe('/debugger /runs')
    expect(health?.status).toBe(200)
    expect(outside).toBeNull()

    expect(seen).toEqual([
      { access: 'read', name: 'debugger' },
      { access: 'read', name: 'debugger' },
    ])

    await looms.stop()
  })

  test('rejects a debugger mount that overlaps the HTTP API', () => {
    expect(() =>
      createLooms({
        debugger: {
          basePath: '/runs',
          fetch: () => Promise.resolve(null),
        },
      }),
    ).toThrow('overlaps the HTTP API')
  })
})
