import { describe, expect, test } from 'bun:test'

import { agent, defineAgent, steer, type Message } from '@looms/agent'
import { wait } from '@looms/core'
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

describe('signal interrupts', () => {
  test("an interrupting steer aborts the agent's in-flight turn through the module rule", async () => {
    let turnStarted = false
    let aborted = false

    const slow = defineAgent({
      name: 'slow-assistant',
      instructions: 'answer',
      runTurn: ({ signal }) =>
        new Promise((resolve) => {
          turnStarted = true

          signal?.addEventListener('abort', () => {
            aborted = true
            resolve({ message: { role: 'assistant', content: 'stopped' }, done: true })
          })
        }),
    })

    const looms = createLooms({ modules: [agent({ definitions: [slow] })] })
    const starting = looms.start(slow, 'hello')

    await waitFor(() => turnStarted)

    const [runId] = await looms.listRuns()
    const run = await looms.getRun(runId!)

    // The steer starts a new turn that blocks too, so the signal's wake never settles here.
    void looms
      .signal(runId!, [steer({ content: 'change course' }, { threadId: run.rootThreadId! })])
      .catch(() => undefined)

    await waitFor(() => aborted)
    expect(aborted).toBe(true)
    // The interrupting steer starts a follow-up turn that also waits on abort; stop the
    // runtime instead of awaiting that hung turn.
    void starting.catch(() => undefined)
    await looms.stop()
  })

  test('an interrupting steer answers open tool calls and cancels the children they started', async () => {
    const seen: Message[][] = []

    const job = defineWorkflow({
      name: 'long_job',
      nodes: [
        {
          id: 'hold',
          run: (ctx) => ctx.effects([wait({ waitId: 'hold', on: { type: 'never' } })]),
        },
      ],
    })

    const assistant = defineAgent({
      name: 'steerable-assistant',
      instructions: 'answer',
      conversational: true,
      tools: [job],
      runTurn: ({ turn, messages }) => {
        seen.push(messages)
        const toolCalls = turn === 1 ? [{ id: 'job-1', name: 'long_job', arguments: {} }] : []
        return { message: { role: 'assistant', content: '', toolCalls }, toolCalls }
      },
    })

    const looms = createLooms({
      modules: [agent({ definitions: [assistant] }), workflow({ definitions: [job] })],
    })

    const { runId, threadId, state } = await looms.start(assistant, 'start the job')

    const child = Object.values(state.threads).find(
      (thread) => thread.definitionName === 'long_job',
    )

    const steered = await looms.signal(runId, [steer({ content: 'change course' }, { threadId })])

    expect(steered.threads[child!.threadId]?.status).toBe('cancelled')

    expect(seen.at(-1)?.map((line) => [line.role, line.toolCallId ?? null])).toEqual([
      ['user', null],
      ['assistant', null],
      ['tool', 'job-1'],
      ['user', null],
    ])

    await looms.stop()
  })

  test('a non-interrupt steer wakes an idle conversational agent without aborting work', async () => {
    const seen: string[] = []
    let firstTurnStarted = false

    const assistant = defineAgent({
      name: 'idle-steerable',
      instructions: 'answer',
      conversational: true,
      runTurn: ({ messages }) => {
        const content = messages.findLast((message) => message.role === 'user')?.content ?? ''
        seen.push(content)

        if (content === 'hello') {
          firstTurnStarted = true
          return { message: { role: 'assistant', content: 'hi' }, done: true }
        }

        return { message: { role: 'assistant', content: `heard: ${content}` }, done: true }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })
    const { runId, threadId } = await looms.start(assistant, 'hello')

    await waitFor(() => firstTurnStarted && seen.includes('hello'))

    await looms.signal(runId, [steer({ content: 'keep going', interrupt: false }, { threadId })])

    await waitFor(() => seen.includes('keep going'))
    expect(seen).toEqual(['hello', 'keep going'])

    await looms.stop()
  })

  test('a non-interrupt steer that arrives mid-call is answered on the next turn', async () => {
    const seen: string[] = []
    let releaseFirst: (() => void) | undefined
    let firstTurnStarted = false

    const assistant = defineAgent({
      name: 'midcall-steerable',
      instructions: 'answer',
      conversational: true,
      runTurn: async ({ messages }) => {
        const content = messages.findLast((message) => message.role === 'user')?.content ?? ''
        seen.push(content)

        if (content === 'hello') {
          firstTurnStarted = true

          await new Promise<void>((resolve) => {
            releaseFirst = resolve
          })

          return { message: { role: 'assistant', content: 'hi' }, done: true }
        }

        return { message: { role: 'assistant', content: `heard: ${content}` }, done: true }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })
    const starting = looms.start(assistant, 'hello')
    await waitFor(() => firstTurnStarted)
    const [runId] = await looms.listRuns()
    const { rootThreadId } = await looms.getRun(runId!)

    // Do not await: the wake waits on the in-flight turn, which we release next.
    void looms
      .signal(runId!, [
        steer({ content: 'late request', interrupt: false }, { threadId: rootThreadId! }),
      ])
      .catch(() => undefined)

    await waitFor(() => releaseFirst !== undefined)
    releaseFirst?.()
    await starting

    await waitFor(() => seen.includes('late request'))
    expect(seen).toEqual(['hello', 'late request'])

    await looms.stop()
  })
})
