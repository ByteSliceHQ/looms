import { describe, expect, test } from 'bun:test'

import { Effect } from 'effect'

import {
  agent,
  cancelActiveAgentTurn,
  defineAgent,
  defineAgentSession,
  sendAgentSessionMessage,
  submitAgentMessage,
} from '@looms/agent'
import { isJsonObject, isJsonString, makeMemoryEventStore } from '@looms/core'

import { createLooms } from './looms'

async function waitFor(predicate: () => boolean, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!predicate() && Date.now() < deadline) {
    await Bun.sleep(10)
  }

  if (!predicate()) {
    throw new Error('timed out waiting for condition')
  }
}

describe('agent-session mailbox', () => {
  test('admits follow-ups in FIFO order and durably deduplicates message ids', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'session-assistant',
      instructions: 'answer',
      runTurn: ({ messages }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)
        return {
          message: { role: 'assistant', content: text },
          done: true,
          output: { text },
        }
      },
    })

    const session = defineAgentSession({ name: 'support-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)

    await looms.signal(started.runId, [
      submitAgentMessage('msg-1', 'first', { threadId: started.threadId }),
      submitAgentMessage('msg-2', 'second', { threadId: started.threadId }),
    ])

    await looms.signal(started.runId, [
      submitAgentMessage('msg-1', 'duplicate', { threadId: started.threadId }),
    ])

    expect(calls).toEqual(['first', 'second'])
    const state = await looms.getRun(started.runId)
    const sessionState = state.threads[started.threadId]?.state
    expect(JSON.stringify(sessionState)).toContain('"processedMessageIds":["msg-1","msg-2"]')
    await looms.stop()
  })

  test('runs the initial message supplied when the session starts', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'initial-assistant',
      instructions: 'answer',
      runTurn: ({ messages }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)
        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'initial-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session, { messageId: 'boot', text: 'hello' })

    await waitFor(() => calls.length === 1)
    await looms.wake(started.runId)

    const state = await looms.getRun(started.runId)
    expect(calls).toEqual(['hello'])
    expect(JSON.stringify(state.threads[started.threadId]?.state)).toContain('"activeTurn":null')
    await looms.stop()
  })

  test('holds nextTurn context until another message fires a turn', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'context-assistant',
      instructions: 'answer',
      runTurn: ({ messages }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)
        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'context-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)

    await sendAgentSessionMessage(looms, started.runId, 'context', 'for the record', {
      delivery: 'nextTurn',
    })

    expect(calls).toEqual([])
    await sendAgentSessionMessage(looms, started.runId, 'request', 'now answer')
    expect(calls).toEqual(['for the record\nnow answer'])
    await looms.stop()
  })

  test('consumes an in-flight steer once and closes it under its own identity', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'steer-assistant',
      instructions: 'answer',
      runTurn: ({ messages, signal }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)

        if (calls.length === 1) {
          return new Promise((resolve, reject) => {
            signal?.addEventListener('abort', () => reject(signal.reason), { once: true })

            setTimeout(
              () =>
                resolve({
                  message: { role: 'assistant', content: text },
                  done: true,
                }),
              5_000,
            )
          })
        }

        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'steer-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)

    const first = sendAgentSessionMessage(looms, started.runId, 'msg-1', 'first')
    await waitFor(() => calls.length === 1)

    await sendAgentSessionMessage(looms, started.runId, 'msg-2', 'steer', {
      delivery: 'steer',
    })

    await first

    expect(calls.at(-1)).toBe('steer')
    const events = await looms.getEvents(started.runId)

    const closed = events
      .filter((event) => event.type === 'agent.session.turn.closed')
      .map((event) => JSON.stringify(event.payload))

    expect(closed.some((payload) => payload.includes('"messageId":"msg-2"'))).toBe(true)
    await looms.stop()
  })

  test('falls back to a follow-up when a steer is not consumed in time', async () => {
    const calls: string[] = []
    const released = Promise.withResolvers<void>()

    const assistant = defineAgent({
      name: 'late-steer-assistant',
      instructions: 'answer',
      runTurn: async ({ messages }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)

        if (text === 'first') {
          await released.promise
        }

        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'late-steer-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)

    const first = sendAgentSessionMessage(looms, started.runId, 'msg-1', 'first')
    await waitFor(() => calls.length === 1)

    const current = await looms.getRun(started.runId)
    const currentState = current.threads[started.threadId]?.state

    const activeTurn =
      isJsonObject(currentState) && isJsonObject(currentState.activeTurn)
        ? currentState.activeTurn
        : null

    const activeChildThreadId =
      activeTurn && isJsonString(activeTurn.childThreadId) ? activeTurn.childThreadId : undefined

    const lateSteer = looms.signal(started.runId, [
      submitAgentMessage('msg-2', 'late steer', {
        delivery: 'steer',
        threadId: started.threadId,
        activeChildThreadId,
      }),
    ])

    await Bun.sleep(10)
    released.resolve()
    await Promise.all([first, lateSteer])

    expect(calls).toEqual(['first', 'late steer'])
    await looms.stop()
  })

  test('cancels only the active child and preserves queued messages', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'cancel-assistant',
      instructions: 'answer',
      runTurn: ({ messages, signal }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)

        if (text === 'first') {
          return new Promise((_, reject) => {
            signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
          })
        }

        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'cancel-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)

    const first = sendAgentSessionMessage(looms, started.runId, 'msg-1', 'first')
    await waitFor(() => calls.length === 1)

    const queued = looms.signal(started.runId, [
      submitAgentMessage('msg-2', 'second', { threadId: started.threadId }),
    ])

    await Bun.sleep(10)
    await cancelActiveAgentTurn(looms, started.runId)
    await waitFor(() => calls.includes('second'))
    await Promise.allSettled([first, queued])

    expect(calls).toEqual(['first', 'second'])
    await looms.stop()
  })

  test('parks on idle timeout and restarts when mail arrives', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'parked-assistant',
      instructions: 'answer',
      runTurn: ({ messages }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)
        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({
      name: 'parked-session',
      agent: assistant,
      idleTimeoutMs: 20,
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)
    await Bun.sleep(40)
    await looms.wake(started.runId)

    let state = await looms.getRun(started.runId)
    expect(JSON.stringify(state.threads[started.threadId]?.state)).toContain('"parked":true')
    expect(state.status).toBe('running')

    await sendAgentSessionMessage(looms, started.runId, 'restart', 'wake up')
    state = await looms.getRun(started.runId)
    expect(calls).toEqual(['wake up'])
    expect(JSON.stringify(state.threads[started.threadId]?.state)).toContain('"parked":false')
    await looms.stop()
  })

  test('recovers mailbox dedupe state from a parked snapshot', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'recovery-assistant',
      instructions: 'answer',
      runTurn: ({ messages }) => {
        const text = messages.findLast((message) => message.role === 'user')?.content ?? ''
        calls.push(text)
        return { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'recovery-session', agent: assistant })
    const store = await Effect.runPromise(makeMemoryEventStore)

    const firstRuntime = createLooms({
      modules: [agent({ definitions: [assistant, session] })],
      store,
    })

    const started = await firstRuntime.start(session)
    await sendAgentSessionMessage(firstRuntime, started.runId, 'durable-id', 'once')
    await firstRuntime.stop()

    const recovered = createLooms({
      modules: [agent({ definitions: [assistant, session] })],
      store,
    })

    await recovered.signal(started.runId, [
      submitAgentMessage('durable-id', 'duplicate', { threadId: started.threadId }),
    ])

    expect(calls).toEqual(['once'])
    await recovered.stop()
  })
})
