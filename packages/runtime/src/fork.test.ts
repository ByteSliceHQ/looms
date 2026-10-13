import { describe, expect, test } from 'bun:test'

import { Predicate } from 'effect'

import { agent, conversation, defineAgent, userMessage, type Message } from '@looms/agent'
import { wait, type RunState } from '@looms/core'
import { defineWorkflow, workflow } from '@looms/workflow'

import { ForkConflictError, RunNotFinishedError, RunNotFoundError } from './errors'
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

function rootOutput(state: RunState) {
  return state.rootThreadId ? state.threads[state.rootThreadId]?.output : undefined
}

function lastUserText(messages: readonly Message[]): string {
  return messages.findLast((message) => message.role === 'user')?.content ?? ''
}

const holding = defineWorkflow({
  name: 'holding',
  nodes: [
    {
      id: 'hold',
      run: (ctx) => ctx.effects([wait({ waitId: 'hold', on: { type: 'test.release' } })]),
    },
  ],
})

describe('forking a run', () => {
  test('re-runs the step whose failure ended a workflow run', async () => {
    const calls = { first: 0, second: 0 }

    const brittle = defineWorkflow({
      name: 'brittle',
      nodes: [
        { id: 'first', run: () => ++calls.first },
        {
          id: 'second',
          deps: ['first'],
          run: () => {
            calls.second += 1

            if (calls.second === 1) {
              throw new Error('flaked')
            }

            return 'recovered'
          },
        },
      ],
      output: ({ results }) => results.second ?? null,
    })

    const looms = createLooms({ modules: [workflow({ definitions: [brittle] })] })
    const source = await looms.start(brittle, {})
    expect(source.state.status).toBe('failed')

    const forked = await looms.fork(source.runId)

    expect(forked.runId).not.toBe(source.runId)
    expect(forked.threadId).toBe(source.threadId)
    expect(forked.state.status).toBe('completed')
    expect(rootOutput(forked.state)).toBe('recovered')
    expect(forked.state.forkedFrom?.runId).toBe(source.runId)
    expect(calls).toEqual({ first: 1, second: 2 })
    expect((await looms.getRun(source.runId)).status).toBe('failed')
    await looms.stop()
  })

  test('re-runs only the failed child of a fanout', async () => {
    const calls: string[] = []

    const child = defineWorkflow({
      name: 'flaky-child',
      nodes: [
        {
          id: 'out',
          run: (ctx) => {
            const item = Predicate.isString(ctx.input) ? ctx.input : ''
            calls.push(item)

            if (item === 'b' && calls.filter((call) => call === 'b').length === 1) {
              throw new Error('b broke')
            }

            return item.toUpperCase()
          },
        },
      ],
      output: ({ results }) => results.out ?? null,
    })

    const mapper = defineWorkflow({
      name: 'flaky-mapper',
      nodes: [{ id: 'items', run: (ctx) => ctx.fanout(child, ['a', 'b']) }],
      output: ({ results }) => results.items ?? null,
    })

    const looms = createLooms({ modules: [workflow({ definitions: [child, mapper] })] })
    const source = await looms.start(mapper, {})
    expect(source.state.status).toBe('failed')

    const forked = await looms.fork(source.runId)

    expect(forked.state.status).toBe('completed')
    expect(rootOutput(forked.state)).toEqual(['A', 'B'])
    expect(calls.filter((call) => call === 'b')).toHaveLength(2)
    await looms.stop()
  })

  test('resumes a cancelled agent where the cancellation cut it off', async () => {
    const calls: string[] = []

    const assistant = defineAgent({
      name: 'resumable-assistant',
      instructions: 'answer',
      conversational: true,
      runTurn: ({ messages, signal }) => {
        const text = lastUserText(messages)
        calls.push(text)

        return calls.length === 1
          ? new Promise((_, reject) => {
              signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
            })
          : { message: { role: 'assistant', content: `re: ${text}` }, done: true }
      },
    })

    const looms = createLooms({ modules: [agent({ definitions: [assistant] })] })
    const starting = looms.start(assistant, 'hello')
    await waitFor(() => calls.length === 1)
    const [sourceRunId] = await looms.listRuns()
    await looms.cancel(sourceRunId!)
    await starting

    const forked = await looms.fork(sourceRunId!)
    const forkTypes = (await looms.getEvents(forked.runId)).map((event) => event.type)

    expect(calls).toEqual(['hello', 'hello'])
    expect(forked.state.status).toBe('running')
    expect(forkTypes).not.toContain('runtime.thread.cancelled')
    expect(forkTypes).toContain('runtime.run.forked')

    await looms.signal(forked.runId, [userMessage('more', { threadId: forked.threadId })])

    expect(
      (await looms.project(forked.runId, conversation)).lines.map((line) => line.content),
    ).toEqual(['re: hello', 'more', 're: more'])

    await looms.stop()
  })

  test('returns the existing fork when retried with the same run id', async () => {
    const looms = createLooms({ modules: [workflow({ definitions: [holding] })] })
    const source = await looms.start(holding, {})
    await looms.cancel(source.runId)

    const first = await looms.fork(source.runId, { runId: 'run_fork' })
    const eventCount = (await looms.getEvents('run_fork')).length
    const retried = await looms.fork(source.runId, { runId: 'run_fork' })

    expect(retried.runId).toBe(first.runId)
    expect(await looms.getEvents('run_fork')).toHaveLength(eventCount)
    await looms.stop()
  })

  test('rejects runs that are still going, missing, or already taken', async () => {
    const looms = createLooms({ modules: [workflow({ definitions: [holding] })] })
    const live = await looms.start(holding, {})
    const other = await looms.start(holding, {})
    await looms.cancel(other.runId)

    expect(looms.fork(live.runId)).rejects.toBeInstanceOf(RunNotFinishedError)
    expect(looms.fork('run_missing')).rejects.toBeInstanceOf(RunNotFoundError)

    expect(looms.fork(other.runId, { runId: live.runId })).rejects.toBeInstanceOf(ForkConflictError)

    await looms.stop()
  })

  test('POST /runs/:runId/fork starts the fork, 404s a missing run, and maps refusals to 409', async () => {
    const looms = createLooms({ modules: [workflow({ definitions: [holding] })] })
    const live = await looms.start(holding, {})
    const done = await looms.start(holding, {})
    await looms.cancel(done.runId)

    const forkRequest = (runId: string, body?: { runId: string }) =>
      looms.fetch(
        new Request(`http://looms.test/runs/${runId}/fork`, {
          method: 'POST',
          headers: body ? { 'content-type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        }),
      )

    const created = await forkRequest(done.runId, { runId: 'run_http_fork' })
    const refused = await forkRequest(live.runId)
    const missing = await forkRequest('run_missing')

    expect(created?.status).toBe(200)
    expect(await created?.json()).toMatchObject({ runId: 'run_http_fork' })
    expect(refused?.status).toBe(409)
    expect(missing?.status).toBe(404)
    await looms.stop()
  })
})
