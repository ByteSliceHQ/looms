import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineModule, EffectCatalogSchema } from '@looms/core'

import { definitionsResponse, resolveRunTarget, runIdFromRequest } from './routing'

describe('routing', () => {
  test('definitionsResponse answers effect catalogs without a run', async () => {
    const modules = [
      defineModule({ namespace: 'billing', protocolVersion: '1.0.0' }, (scope) => ({
        effects: {
          capture: scope.effect({
            type: 'billing.capture',
            placement: 'worker',
            retry: { maxAttempts: 2, startToCloseTimeoutMs: 5_000 },
          }),
        },
      })),
    ]

    const response = definitionsResponse(
      new Request('http://localhost/definitions/effects'),
      modules,
    )

    const body = Schema.decodeUnknownSync(EffectCatalogSchema)(await response?.json())

    expect(response?.status).toBe(200)

    expect(body.effects).toContainEqual({
      type: 'billing.capture',
      placement: 'worker',
      retry: { maxAttempts: 2, startToCloseTimeoutMs: 5_000 },
    })

    expect(definitionsResponse(new Request('http://localhost/runs'), modules)).toBeNull()
  })

  test('runIdFromRequest extracts runId from various paths', () => {
    expect(runIdFromRequest(new Request('http://localhost:8787/runs/run_abc123'))).toBe(
      'run_abc123',
    )

    expect(runIdFromRequest(new Request('http://localhost:8787/runs/run_abc123/events'))).toBe(
      'run_abc123',
    )

    expect(runIdFromRequest(new Request('http://localhost:8787/runs/run_abc123/threads'))).toBe(
      'run_abc123',
    )

    const reqWithHeader = new Request('http://localhost:8787/runs', {
      headers: { 'x-looms-run-id': 'run_header' },
    })

    expect(runIdFromRequest(reqWithHeader)).toBe('run_header')

    expect(runIdFromRequest(new Request('http://localhost:8787/runs'))).toBeNull()
    expect(runIdFromRequest(new Request('http://localhost:8787/health'))).toBeNull()
  })

  test('resolveRunTarget preserves existing runId and sets header', async () => {
    const req = new Request('http://localhost:8787/runs/run_existing/events', {
      method: 'GET',
    })

    const { runId, request } = await resolveRunTarget(req)

    expect(runId).toBe('run_existing')
    expect(request.headers.get('x-looms-run-id')).toBe('run_existing')
  })

  test('resolveRunTarget generates runId for POST /runs when absent', async () => {
    const req = new Request('http://localhost:8787/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'echo', definitionName: 'echo' }),
    })

    const { runId, request } = await resolveRunTarget(req)

    expect(runId).toMatch(/^run_/)
    expect(request.headers.get('x-looms-run-id')).toBe(runId)

    const parsed: unknown = await request.json()

    expect(parsed).toEqual({
      kind: 'echo',
      definitionName: 'echo',
      runId,
    })
  })

  test('resolveRunTarget uses explicit runId in POST /runs body', async () => {
    const req = new Request('http://localhost:8787/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'echo', definitionName: 'echo', runId: 'run_explicit' }),
    })

    const { runId, request } = await resolveRunTarget(req)

    expect(runId).toBe('run_explicit')
    expect(request.headers.get('x-looms-run-id')).toBe('run_explicit')

    const parsed: unknown = await request.json()

    expect(parsed).toEqual({
      kind: 'echo',
      definitionName: 'echo',
      runId: 'run_explicit',
    })
  })
})
