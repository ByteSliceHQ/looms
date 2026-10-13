import { describe, expect, test } from 'bun:test'

import { agent, defineAgent, userMessage } from '@looms/agent'

import { RunTerminalError } from './errors'
import { createLooms } from './looms'

const assistant = defineAgent({
  name: 'terminal-assistant',
  instructions: 'answer',
  conversational: true,
  runTurn: () => Promise.resolve({ message: { role: 'assistant', content: 'ok' }, done: true }),
})

function setup() {
  return createLooms({ modules: [agent({ definitions: [assistant] })] })
}

describe('signals to a terminal run', () => {
  test('are rejected without appending events', async () => {
    const looms = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')
    await looms.cancel(runId)
    const before = await looms.getEvents(runId)

    expect(
      looms.signal(runId, [userMessage('are you there?', { threadId })]),
    ).rejects.toBeInstanceOf(RunTerminalError)

    expect(await looms.getEvents(runId)).toEqual(before)
    await looms.stop()
  })

  test('answer 409 over HTTP', async () => {
    const looms = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')
    await looms.cancel(runId)

    const response = await looms.fetch(
      new Request(`http://looms.test/runs/${runId}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events: [userMessage('hello?', { threadId })] }),
      }),
    )

    expect(response?.status).toBe(409)

    expect(await response?.json()).toEqual({
      error: `Run "${runId}" is cancelled and accepts no new events`,
      status: 'cancelled',
    })

    await looms.stop()
  })

  test('still deduplicate a retry accepted before the run ended', async () => {
    const looms = setup()
    const { runId, threadId } = await looms.start(assistant, 'hello')
    const message = [userMessage('follow up', { threadId })]

    await looms.signal(runId, message, { idempotencyKey: 'msg-1' })
    await looms.cancel(runId)
    const before = await looms.getEvents(runId)

    const retried = await looms.signal(runId, message, { idempotencyKey: 'msg-1' })

    expect(retried.status).toBe('cancelled')
    expect(await looms.getEvents(runId)).toEqual(before)

    expect(looms.signal(runId, message, { idempotencyKey: 'msg-2' })).rejects.toBeInstanceOf(
      RunTerminalError,
    )

    await looms.stop()
  })
})
