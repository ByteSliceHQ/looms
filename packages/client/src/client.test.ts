import { describe, expect, test } from 'bun:test'
import { defineAgent } from '@looms/core'
import { Predicate } from 'effect'
import { createLoomsClient } from './client'

describe('@looms/client', () => {
  test('createLoomsClient exposes expected methods', () => {
    const client = createLoomsClient({ baseUrl: 'http://127.0.0.1:8787' })
    expect(Predicate.isFunction((...args: [any]) => client.startAgent(...args))).toBe(true)
    expect(Predicate.isFunction((...args: [any]) => client.startWorkflow(...args))).toBe(true)
    expect(Predicate.isFunction(client.getState)).toBe(true)
    expect(Predicate.isFunction(client.getEvents)).toBe(true)
    expect(Predicate.isFunction(client.sendMessage)).toBe(true)
    expect(Predicate.isFunction(client.decideReview)).toBe(true)
    expect(Predicate.isFunction(client.subscribeEvents)).toBe(true)
  })

  test('createLoomsClient() uses same-origin relative paths', async () => {
    const calls: string[] = []
    const fetchMock: typeof fetch = async (input) => {
      calls.push(Predicate.isString(input) ? input : input instanceof Request ? input.url : '')
      return new Response(JSON.stringify({ actorId: 'a1', state: { status: 'running' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createLoomsClient({ fetch: fetchMock })
    await client.startAgent('echo', { text: 'hi' })
    expect(calls).toEqual(['/actors/agent'])
  })

  test('empty baseUrl strips trailing slash and stays relative', async () => {
    const calls: string[] = []
    const fetchMock: typeof fetch = async (input) => {
      calls.push(Predicate.isString(input) ? input : input instanceof Request ? input.url : '')
      return new Response(JSON.stringify({ state: { status: 'completed' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createLoomsClient({ baseUrl: '', fetch: fetchMock })
    await client.getState('actor_1')
    expect(calls).toEqual(['/actors/actor_1/state'])
  })

  test('createLoomsClient with definitions type accepts typed startAgent', async () => {
    const echo = defineAgent({
      name: 'echo',
      instructions: 'Echo',
      runTurn: () => ({ message: { role: 'assistant', content: 'done' }, done: true }),
    })
    const defs = [echo] as const

    const calls: string[] = []
    const fetchMock: typeof fetch = async (input) => {
      calls.push(Predicate.isString(input) ? input : input instanceof Request ? input.url : '')
      return new Response(JSON.stringify({ actorId: 'echo_1', state: { status: 'running' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createLoomsClient<typeof defs>({ fetch: fetchMock })
    const res = await client.startAgent('echo', { foo: 'bar' })
    expect(res.actorId).toBe('echo_1')

    const res2 = await client.startAgent(echo, { foo: 'baz' })
    expect(res2.actorId).toBe('echo_1')
  })
})
