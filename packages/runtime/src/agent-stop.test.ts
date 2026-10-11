import { describe, expect, test } from 'bun:test'

import {
  agent,
  conversation,
  defineAgent,
  defineAgentSession,
  defineTool,
  sendAgentSessionMessage,
  stopAgentTurn,
  userMessage,
  type Message,
} from '@looms/agent'
import { isJsonObject, wait } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { createLooms } from './looms'

async function waitFor(predicate: () => boolean, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!predicate() && Date.now() < deadline) {
    await Bun.sleep(5)
  }

  if (!predicate()) {
    throw new Error('timed out waiting for condition')
  }
}

function blockUntilAborted(signal: AbortSignal | undefined): Promise<never> {
  return new Promise((_, reject) => {
    signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

function lastUserText(messages: readonly Message[]): string {
  return messages.findLast((message) => message.role === 'user')?.content ?? ''
}

describe('stopping an agent turn', () => {
  test('aborts the in-flight turn and answers the next message', async () => {
    const calls: string[] = []
    let aborted = false

    const assistant = defineAgent({
      name: 'stoppable-assistant',
      instructions: 'answer',
      conversational: true,
      runTurn: ({ messages, signal }) => {
        const text = lastUserText(messages)
        calls.push(text)

        if (text === 'slow') {
          signal?.addEventListener('abort', () => (aborted = true), { once: true })
          return blockUntilAborted(signal)
        }

        return { message: { role: 'assistant', content: `re: ${text}` }, done: true }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })
    const starting = looms.start(assistant, 'slow')
    await waitFor(() => calls.length === 1)
    const [runId] = await looms.listRuns()
    const { rootThreadId } = await looms.getRun(runId!)

    const stopped = await looms.signal(runId!, [stopAgentTurn({ threadId: rootThreadId! })])
    await starting

    expect(aborted).toBe(true)
    expect(stopped.status).toBe('running')
    expect(calls).toEqual(['slow'])

    const answered = await looms.signal(runId!, [userMessage('again', { threadId: rootThreadId! })])

    expect(calls).toEqual(['slow', 'again'])

    expect((await looms.project(runId!, conversation)).lines.map((line) => line.content)).toEqual([
      'again',
      're: again',
    ])

    expect(answered.status).toBe('running')
    await looms.stop()
  })

  test('drops text deltas a stopped model call emits after the abort', async () => {
    let streaming = false

    const llm = {
      complete: (args: {
        signal?: AbortSignal
        onTextDelta?: (delta: string) => void | Promise<void>
      }) =>
        Promise.resolve(args.onTextDelta?.('early')).then(() => {
          streaming = true

          return new Promise<never>((_, reject) => {
            args.signal?.addEventListener(
              'abort',
              () => {
                void Promise.resolve(args.onTextDelta?.('late')).finally(() =>
                  reject(args.signal?.reason),
                )
              },
              { once: true },
            )
          })
        }),
    }

    const assistant = defineAgent({
      name: 'streaming-assistant',
      instructions: 'answer',
      conversational: true,
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant], llm })] })
    const starting = looms.start(assistant, 'hello')
    await waitFor(() => streaming)
    const [runId] = await looms.listRuns()
    const { rootThreadId } = await looms.getRun(runId!)

    await looms.signal(runId!, [stopAgentTurn({ threadId: rootThreadId! })])
    await starting
    await Bun.sleep(20)

    const deltas = (await looms.getEvents(runId!)).flatMap((event) =>
      event.type === 'agent.turn.text_delta' && isJsonObject(event.payload)
        ? [event.payload.delta]
        : [],
    )

    expect(deltas).toEqual(['early'])
    await looms.stop()
  })

  test('closes a running tool call so the next turn sees a valid transcript', async () => {
    const seen: Message[][] = []
    let toolStarted = false

    const slowTool = defineTool({
      name: 'slow_tool',
      description: 'never returns',
      handler: (_input, ctx) => {
        toolStarted = true
        return blockUntilAborted(ctx.signal)
      },
    })

    const assistant = defineAgent({
      name: 'tool-assistant',
      instructions: 'answer',
      conversational: true,
      tools: [slowTool],
      runTurn: ({ messages }) => {
        seen.push(messages)

        if (lastUserText(messages) === 'use the tool') {
          const toolCalls = [{ id: 'call-1', name: 'slow_tool', arguments: {} }]
          return { message: { role: 'assistant', content: '', toolCalls }, toolCalls }
        }

        return { message: { role: 'assistant', content: 'ok' }, done: true }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })
    const starting = looms.start(assistant, 'use the tool')
    await waitFor(() => toolStarted)
    const [runId] = await looms.listRuns()
    const { rootThreadId } = await looms.getRun(runId!)

    await looms.signal(runId!, [stopAgentTurn({ threadId: rootThreadId! })])
    await starting
    await looms.signal(runId!, [userMessage('never mind', { threadId: rootThreadId! })])

    expect(seen.at(-1)?.map((line) => [line.role, line.toolCallId ?? null])).toEqual([
      ['user', null],
      ['assistant', null],
      ['tool', 'call-1'],
      ['user', null],
    ])

    expect((await looms.project(runId!, conversation)).lines.map((line) => line.role)).toEqual([
      'assistant',
      'tool',
      'user',
      'assistant',
    ])

    await looms.stop()
  })

  test('cancels child threads started by tool calls', async () => {
    const child = defineWorkflow({
      name: 'long_job',
      nodes: [
        {
          id: 'hold',
          run: (ctx) => ctx.effects([wait({ waitId: 'hold', on: { type: 'never' } })]),
        },
      ],
    })

    const assistant = defineAgent({
      name: 'delegating-assistant',
      instructions: 'delegate',
      conversational: true,
      tools: [child],
      runTurn: ({ turn }) => {
        const toolCalls = turn === 1 ? [{ id: 'job-1', name: 'long_job', arguments: {} }] : []
        return { message: { role: 'assistant', content: '', toolCalls }, toolCalls }
      },
    })

    const looms = createLooms({
      modules: [agent({ definitions: [assistant] }), workflow({ definitions: [child] })],
    })

    const { runId, threadId, state } = await looms.start(assistant, 'start the job')
    const job = Object.values(state.threads).find((thread) => thread.definitionName === 'long_job')
    expect(job?.status).toBe('waiting')

    const stopped = await looms.signal(runId, [stopAgentTurn({ threadId })])

    expect(stopped.threads[job!.threadId]?.status).toBe('cancelled')
    expect(stopped.threads[threadId]?.status).toBe('waiting')
    await looms.stop()
  })

  test('cancels the active turn of an agent session and keeps the session open', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'session-assistant',
      instructions: 'answer',
      runTurn: ({ messages, signal }) => {
        const text = lastUserText(messages)
        calls.push(text)

        return text === 'slow'
          ? blockUntilAborted(signal)
          : { message: { role: 'assistant', content: text }, done: true }
      },
    })

    const session = defineAgentSession({ name: 'stoppable-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const started = await looms.start(session)

    const first = sendAgentSessionMessage(looms, started.runId, 'msg-1', 'slow')
    await waitFor(() => calls.length === 1)

    const stopped = await looms.signal(started.runId, [
      stopAgentTurn({ threadId: started.threadId }),
    ])

    await first
    expect(stopped.status).toBe('running')
    await sendAgentSessionMessage(looms, started.runId, 'msg-2', 'fast')

    expect(calls).toEqual(['slow', 'fast'])
    await looms.stop()
  })
})
