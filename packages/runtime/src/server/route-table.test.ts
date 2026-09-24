import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { integer, matchRoute, oneOf, route } from './route-table'

const callback = route({
  method: 'POST',
  path: '/runs/:runId/effects/:effectId/:attempt/:action',
  name: 'effects.workerCallback',
  access: 'worker',
  params: { attempt: integer, action: oneOf(['started', 'complete']) },
  handle: ({ params }) => Effect.succeed(Response.json(params)),
})

const run = route({
  method: 'GET',
  path: '/runs/:runId',
  name: 'runs.get',
  access: 'read',
  handle: ({ params }) => Effect.succeed(Response.json(params)),
})

describe('route table', () => {
  test('decodes typed and URI-encoded path parameters', () => {
    const matched = matchRoute([run, callback], 'POST', '/runs/run%201/effects/eff%3A1/2/started')

    expect(matched?.route.name).toBe('effects.workerCallback')

    expect(matched?.params).toEqual({
      runId: 'run 1',
      effectId: 'eff:1',
      attempt: 2,
      action: 'started',
    })
  })

  test('rejects segments that a decoder does not accept', () => {
    expect(matchRoute([callback], 'POST', '/runs/r/effects/e/two/started')).toBeNull()
    expect(matchRoute([callback], 'POST', '/runs/r/effects/e/2/unknown')).toBeNull()
    expect(matchRoute([run], 'GET', '/runs/%E0%A4%A')).toBeNull()
  })

  test('matches on method and segment count', () => {
    expect(matchRoute([run], 'POST', '/runs/r')).toBeNull()
    expect(matchRoute([run], 'GET', '/runs/r/extra')).toBeNull()
    expect(matchRoute([run], 'GET', '/runs/r')?.params).toEqual({ runId: 'r' })
  })
})
