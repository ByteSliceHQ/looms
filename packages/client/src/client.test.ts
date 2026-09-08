import { describe, expect, test } from 'bun:test'
import { Predicate } from 'effect'
import { createLoomsClient } from './client'

function hrefOf(input: RequestInfo | URL): string {
  if (Predicate.isString(input)) return input
  if (input instanceof URL) return input.href
  if (input instanceof Request) return input.url
  return '/runs'
}

describe('createLoomsClient', () => {
  test('builds relative run routes', async () => {
    const calls: string[] = []
    const client = createLoomsClient({
      fetch: async (input) => {
        calls.push(hrefOf(input))
        return new Response(JSON.stringify({ runId: 'run_1', threadId: 'thr_1', state: {} }), {
          headers: { 'content-type': 'application/json' },
        })
      },
    })
    await client.start({ kind: 'agent', name: 'echo' }, { text: 'hi' })
    expect(calls[0]).toBe('/runs')
  })
})
