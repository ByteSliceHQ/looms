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
      .signal(runId!, [steer('change course', { threadId: run.rootThreadId! })])
      .catch(() => undefined)

    await waitFor(() => aborted)
    expect(aborted).toBe(true)
    await starting.catch(() => undefined)
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

    const steered = await looms.signal(runId, [steer('change course', { threadId })])

    expect(steered.threads[child!.threadId]?.status).toBe('cancelled')

    expect(seen.at(-1)?.map((line) => [line.role, line.toolCallId ?? null])).toEqual([
      ['user', null],
      ['assistant', null],
      ['tool', 'job-1'],
      ['user', null],
    ])

    await looms.stop()
  })
})
