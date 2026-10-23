import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import { createLooms, grantAuth, issueRunGrant, verifyRunGrant } from '../index'

const secret = 'grant-secret'
const runId = 'run_1'

const claims = {
  runId,
  principal: 'user_1',
  access: 'read' as const,
  exp: 5_000,
}

describe('run grants', () => {
  test('round-trips a signed grant and rejects a different secret', async () => {
    const token = await Effect.runPromise(issueRunGrant(secret, claims))
    const grant = await Effect.runPromise(verifyRunGrant(secret, token, 4_000))

    expect(grant).toEqual(claims)

    const forged = await Effect.runPromise(
      verifyRunGrant('other-secret', token, 4_000).pipe(Effect.flip),
    )

    expect(forged.reason).toBe('signature')
  })

  test('rejects a tampered payload, a bad shape, and an empty principal', async () => {
    const token = await Effect.runPromise(issueRunGrant(secret, claims))
    const [version, payload, signature] = token.split('.')
    const flipped = payload?.[0] === 'A' ? 'B' : 'A'
    const tampered = `${version}.${flipped}${payload?.slice(1)}.${signature}`

    const forged = await Effect.runPromise(
      verifyRunGrant(secret, tampered, 4_000).pipe(Effect.flip),
    )

    expect(forged.reason).toBe('signature')

    const malformed = await Effect.runPromise(
      verifyRunGrant(secret, 'not-a-grant', 4_000).pipe(Effect.flip),
    )

    expect(malformed.reason).toBe('malformed')

    const empty = await Effect.runPromise(
      issueRunGrant(secret, { ...claims, principal: '' }).pipe(Effect.flip),
    )

    expect(empty.reason).toBe('claims')
  })

  test('expires at exp and honors clock skew', async () => {
    const token = await Effect.runPromise(issueRunGrant(secret, claims))
    const expired = await Effect.runPromise(verifyRunGrant(secret, token, 5_000).pipe(Effect.flip))

    expect(expired.reason).toBe('expired')

    const skewed = await Effect.runPromise(verifyRunGrant(secret, token, 5_000, 1))

    expect(skewed.principal).toBe('user_1')
  })

  test('authorizes only a read of the granted run', async () => {
    const token = await Effect.runPromise(issueRunGrant(secret, claims))

    const looms = createLooms({
      modules: [],
      authorize: grantAuth({ secret, now: () => 4_000 }),
    })

    const status = (input: RequestInfo, init?: RequestInit) => looms.fetch(new Request(input, init))

    try {
      const missing = await status(`http://looms.test/runs/${runId}/threads`)
      const query = await status(`http://looms.test/runs/${runId}/threads?grant=${token}`)

      const protocol = await status(`http://looms.test/runs/${runId}/threads`, {
        headers: { 'sec-websocket-protocol': `chat, ${token}` },
      })

      const otherRun = await status(`http://looms.test/runs/run_2/threads?grant=${token}`)
      const unscoped = await status(`http://looms.test/runs?grant=${token}`)

      const write = await status(`http://looms.test/runs/${runId}/wake?grant=${token}`, {
        method: 'POST',
      })

      const badQuery = await status(`http://looms.test/runs/${runId}/threads?grant=nope`, {
        headers: { 'sec-websocket-protocol': token },
      })

      expect(missing?.status).toBe(401)
      expect(query?.status).toBe(200)
      expect(protocol?.status).toBe(200)
      expect(otherRun?.status).toBe(403)
      expect(unscoped?.status).toBe(403)
      expect(write?.status).toBe(403)
      expect(badQuery?.status).toBe(401)
    } finally {
      await looms.stop()
    }
  })
})
