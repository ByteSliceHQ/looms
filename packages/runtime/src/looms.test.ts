import { describe, expect, test } from 'bun:test'
import { defineAgent } from '@looms/core'
import { memory } from '@looms/projectors'
import { Schema } from 'effect'
import { createLooms } from './looms'

describe('createLooms facade', () => {
  const echoAgent = defineAgent({
    name: 'echo',
    instructions: 'Echo text',
    input: Schema.Struct({ text: Schema.String }),
    runTurn: ({ input }) => ({
      message: { role: 'assistant', content: input.text },
      done: true,
      output: { text: input.text },
    }),
  })

  test('starts an agent with validated input', async () => {
    const looms = createLooms({ definitions: [echoAgent] })
    const { actorId, state, output } = await looms.startAgent(echoAgent, { text: 'hello' })
    expect(actorId).toBeDefined()
    expect(state.status).toBe('completed')
    expect(output).toEqual({ text: 'hello' })
  })

  test('rejects invalid input via startAgent', async () => {
    const looms = createLooms({ definitions: [echoAgent] })
    // @ts-expect-error intentionally invalid input
    expect(looms.startAgent(echoAgent, { text: 123 })).rejects.toThrow('Invalid input')
  })

  test('projects started agents onto a memory index', async () => {
    const projector = memory()
    const looms = createLooms({
      definitions: [echoAgent],
      projectors: [projector],
    })
    const { actorId } = await looms.startAgent(echoAgent, { text: 'hello' })
    const actor = await projector.getActor(actorId)
    expect(actor?.definitionName).toBe('echo')
    expect(actor?.status).toBe('completed')
    await looms.stop()
    expect(await projector.getActor(actorId)).toBeNull()
  })

  test('fetch returns null for non-Looms paths', async () => {
    const looms = createLooms({ definitions: [echoAgent] })
    const res = await looms.fetch(new Request('http://localhost/not-a-looms-path'))
    expect(res).toBeNull()
  })

  test('POST /actors/agent validates schema and returns 400 on bad input', async () => {
    const looms = createLooms({ definitions: [echoAgent] })
    const res = await looms.fetch(
      new Request('http://localhost/actors/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ definitionName: 'echo', input: { text: 123 } }),
      }),
    )
    expect(res).not.toBeNull()
    expect(res!.status).toBe(400)
    // SAFETY: HTTP 400 response body contains JSON error object.
    const body = (await res!.json()) as { error: string }
    expect(body.error).toContain('Invalid input')
  })

  test('POST /api/livestore pushes events and handles expectedTail conflicts', async () => {
    const looms = createLooms({ definitions: [echoAgent] })
    const { actorId } = await looms.startAgent(echoAgent, { text: 'init' })

    // GET livestore events
    const getRes = await looms.fetch(
      new Request(`http://localhost/api/livestore?storeId=${actorId}&cursor=0`),
    )
    expect(getRes).not.toBeNull()
    // SAFETY: livestore GET response body contains batch and head.
    const getBody = (await getRes!.json()) as { batch: any[]; head: number }
    expect(getBody.batch.length).toBeGreaterThan(0)
    const currentHead = getBody.head

    // Push with expected parentSeqNum matching head
    const pushRes = await looms.fetch(
      new Request('http://localhost/api/livestore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storeId: actorId,
          batch: [
            {
              name: 'agent.message.received',
              args: {
                id: 'client_msg_1',
                payload: { message: { role: 'user', content: 'from livestore' } },
              },
              seqNum: currentHead + 1,
              parentSeqNum: currentHead,
              clientId: 'test-client',
              sessionId: 'test-session',
            },
          ],
        }),
      }),
    )
    expect(pushRes).not.toBeNull()
    expect(pushRes!.status).toBe(200)

    // Push with outdated parentSeqNum returns 409
    const conflictRes = await looms.fetch(
      new Request('http://localhost/api/livestore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storeId: actorId,
          batch: [
            {
              name: 'agent.message.received',
              args: {
                id: 'client_msg_2',
                payload: { message: { role: 'user', content: 'stale' } },
              },
              seqNum: currentHead + 1,
              parentSeqNum: currentHead, // Outdated now!
              clientId: 'test-client',
              sessionId: 'test-session',
            },
          ],
        }),
      }),
    )
    expect(conflictRes).not.toBeNull()
    expect(conflictRes!.status).toBe(409)
  })
})
