import { describe, expect, test } from 'bun:test'

import { resolveRunTarget, runIdFromRequest } from './routing'

describe('routing', () => {
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

    expect(
      runIdFromRequest(new Request('http://localhost:8787/api/livestore?storeId=run_live1')),
    ).toBe('run_live1')

    expect(
      runIdFromRequest(new Request('http://localhost:8787/api/livestore?runId=run_live2')),
    ).toBe('run_live2')

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
