import { describe, expect, test } from 'bun:test'

import {
  agent,
  conversation,
  defineAgent,
  defineAgentSession,
  defineTool,
  sendAgentSessionMessage,
  stepCountIs,
  stopAgentTurn,
  userMessage,
} from '@looms/agent'
import type { Message } from '@looms/agent'

import { createLooms } from './looms'

const WORDS = ['one ', 'two ', 'three ', 'four ', 'five ', 'six']

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!predicate() && Date.now() < deadline) {
    await Bun.sleep(5)
  }

  if (!predicate()) {
    throw new Error('timed out waiting for condition')
  }
}

interface LlmProbe {
  /** Calls that have emitted at least one delta. */
  streaming: number
  /** Calls that have returned or thrown. */
  settled: number
  aborts: unknown[]
}

/** Streams six words 20ms apart and checks the abort signal before each, like a real adapter. */
function streamingLlm() {
  const probe: LlmProbe = { streaming: 0, settled: 0, aborts: [] }

  const llm = {
    async complete(args: {
      messages: readonly Message[]
      signal?: AbortSignal
      onTextDelta?: (delta: string) => void | Promise<void>
    }) {
      args.signal?.addEventListener('abort', () => probe.aborts.push(args.signal?.reason), {
        once: true,
      })

      let content = ''

      try {
        for (const word of WORDS) {
          if (args.signal?.aborted) {
            throw args.signal.reason
          }

          await Bun.sleep(20)
          content += word
          await args.onTextDelta?.(word)

          if (content === word) {
            probe.streaming += 1
          }
        }

        return { message: { role: 'assistant' as const, content: content.trim() }, done: true }
      } finally {
        probe.settled += 1
      }
    },
  }

  return { llm, probe }
}

describe('conversational agent turns', () => {
  test('the turn after a stopped turn streams and replies', async () => {
    const chat = defineAgent({ name: 'chat', instructions: 'x', conversational: true })
    const { llm, probe } = streamingLlm()
    const looms = createLooms({ modules: [agent({ definitions: [chat], llm })] })
    const { runId, threadId } = await looms.start(chat, 'q1')

    const stoppedTurn = looms.signal(runId, [userMessage({ content: 'q2' })])
    stoppedTurn.catch(() => {})
    await waitFor(() => probe.streaming === 2)
    await looms.signal(runId, [stopAgentTurn({ threadId })])
    // The stopped call emits the delta it was already waiting to send, then sees the abort.
    await waitFor(() => probe.settled === 2)

    const answered = await looms.signal(runId, [userMessage({ content: 'q3' })])
    const events = await looms.getEvents(runId)

    expect(events.filter((event) => event.type === 'runtime.effect.failed')).toEqual([])
    expect(answered.status).toBe('running')

    expect((await looms.project(runId, conversation)).lines.map((line) => line.content)).toEqual([
      'one two three four five six',
      'q2',
      'q3',
      'one two three four five six',
    ])

    await looms.stop()
  })

  test('stopAgentTurn() without a thread id aborts the root agent turn', async () => {
    const chat = defineAgent({ name: 'chat', instructions: 'x', conversational: true })
    const { llm, probe } = streamingLlm()
    const looms = createLooms({ modules: [agent({ definitions: [chat], llm })] })
    const { runId } = await looms.start(chat, 'q1')

    const stoppedTurn = looms.signal(runId, [userMessage({ content: 'q2' })])
    stoppedTurn.catch(() => {})
    await waitFor(() => probe.streaming === 2)
    await looms.signal(runId, [stopAgentTurn()])
    await stoppedTurn.catch(() => {})
    await waitFor(() => probe.settled === 2)

    expect(probe.aborts).toHaveLength(1)

    expect((await looms.project(runId, conversation)).lines.map((line) => line.content)).toEqual([
      'one two three four five six',
      'q2',
    ])

    await looms.stop()
  })

  test('stopAgentTurn() without a thread id aborts the active turn of an agent session', async () => {
    const assistant = defineAgent({ name: 'session-chat', instructions: 'x' })
    const session = defineAgentSession({ name: 'chat-session', agent: assistant })
    const { llm, probe } = streamingLlm()
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session], llm })] })

    const { runId } = await looms.start(session)
    const stoppedTurn = sendAgentSessionMessage(looms, runId, 'msg-1', 'q1')
    await waitFor(() => probe.streaming === 1)
    const stopped = await looms.signal(runId, [stopAgentTurn()])
    await stoppedTurn
    await waitFor(() => probe.settled === 1)

    const events = await looms.getEvents(runId)

    expect(probe.aborts).toHaveLength(1)
    expect(events.filter((event) => event.type === 'agent.message')).toEqual([])
    expect(stopped.status).toBe('running')
    await looms.stop()
  })

  test('maxTurns bounds the model turns spent on one message, not the whole conversation', async () => {
    const chat = defineAgent({
      name: 'bounded-chat',
      instructions: 'x',
      conversational: true,
      maxTurns: 3,
      runTurn: ({ messages }) => ({
        message: { role: 'assistant', content: `re: ${messages.at(-1)?.content}` },
        done: true,
      }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [chat] })] })
    const { runId } = await looms.start(chat, 'q1')

    for (const content of ['q2', 'q3', 'q4']) {
      await looms.signal(runId, [userMessage({ content })])
    }

    expect((await looms.getRun(runId)).status).toBe('running')

    expect((await looms.project(runId, conversation)).lines.map((line) => line.content)).toEqual([
      're: q1',
      'q2',
      're: q2',
      'q3',
      're: q3',
      'q4',
      're: q4',
    ])

    await looms.stop()
  })

  test('maxTurns still fails a conversational agent that loops on one message', async () => {
    let calls = 0
    const noop = defineTool({ name: 'noop', description: 'does nothing', handler: () => ({}) })

    const chat = defineAgent({
      name: 'looping-chat',
      instructions: 'x',
      conversational: true,
      maxTurns: 3,
      tools: [noop],
      runTurn: ({ messages }) => {
        calls += 1
        const loops = messages.findLast((line) => line.role === 'user')?.content === 'loop'
        const toolCalls = loops ? [{ id: `call-${calls}`, name: 'noop', arguments: {} }] : []
        return { message: { role: 'assistant', content: 'ok', toolCalls }, toolCalls }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [chat] })] })
    const { runId, threadId } = await looms.start(chat, 'q1')
    await looms.signal(runId, [userMessage({ content: 'q2' })])
    const looped = await looms.signal(runId, [userMessage({ content: 'loop' })])

    // Two turns answered q1 and q2; the loop then gets its own three before the limit trips.
    expect(calls).toBe(5)
    expect(looped.status).toBe('failed')
    expect(looped.threads[threadId]?.error).toBe('Max turns exceeded (3)')
    await looms.stop()
  })

  test('stopWhen counts steps from the latest user message', async () => {
    let calls = 0
    let toolRuns = 0

    const noop = defineTool({
      name: 'noop',
      description: 'does nothing',
      handler: () => {
        toolRuns += 1
        return {}
      },
    })

    const chat = defineAgent({
      name: 'stepped-chat',
      instructions: 'x',
      conversational: true,
      stopWhen: stepCountIs(2),
      tools: [noop],
      runTurn: ({ messages }) => {
        calls += 1
        const loops = messages.findLast((line) => line.role === 'user')?.content === 'loop'
        const toolCalls = loops ? [{ id: `call-${calls}`, name: 'noop', arguments: {} }] : []
        return { message: { role: 'assistant', content: 'ok', toolCalls }, toolCalls }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [chat] })] })
    const { runId } = await looms.start(chat, 'q1')
    await looms.signal(runId, [userMessage({ content: 'q2' })])
    const looped = await looms.signal(runId, [userMessage({ content: 'loop' })])

    // The third message gets two steps of its own: one that runs the tool, one that stops.
    expect(toolRuns).toBe(1)
    expect(calls).toBe(4)
    expect(looped.status).toBe('running')
    await looms.stop()
  })
})
