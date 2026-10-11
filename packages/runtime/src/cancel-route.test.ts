import { describe, expect, test } from 'bun:test'

import { agent, defineAgent } from '@looms/agent'

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

function blockingAgent() {
  const calls = { started: 0, aborted: 0 }

  const definition = defineAgent({
    name: 'blocking-assistant',
    instructions: 'answer',
    runTurn: ({ signal }) =>
      new Promise((resolve) => {
        calls.started += 1

        signal?.addEventListener('abort', () => {
          calls.aborted += 1
          resolve({ message: { role: 'assistant', content: 'stopped' }, done: true })
        })
      }),
  })

  return { definition, calls }
}

describe('POST /runs/:runId/cancel', () => {
  test('cancels an in-flight agent turn without retrying it', async () => {
    const { definition, calls } = blockingAgent()
    const looms = createLooms({ modules: [agent({ definitions: [definition] })] })
    const starting = looms.start(definition, 'hello')

    await waitFor(() => calls.started === 1)
    const [runId] = await looms.listRuns()

    const response = await looms.fetch(
      new Request(`http://looms.test/runs/${runId}/cancel`, { method: 'POST' }),
    )

    expect(response?.status).toBe(200)
    await starting

    const run = await looms.getRun(runId!)
    const types = (await looms.getEvents(runId!)).map((event) => event.type)

    expect(run.status).toBe('cancelled')
    expect(run.threads[run.rootThreadId!]?.status).toBe('cancelled')
    expect(calls).toEqual({ started: 1, aborted: 1 })
    expect(types).toContain('runtime.thread.cancelled')
    expect(types).toContain('runtime.run.cancelled')
    expect(types.filter((type) => type === 'runtime.effect.attempt.started')).toHaveLength(1)
    expect(types).not.toContain('agent.message')

    await looms.stop()
  })

  test('cancels the thread named in the body', async () => {
    const { definition, calls } = blockingAgent()
    const looms = createLooms({ modules: [agent({ definitions: [definition] })] })
    const starting = looms.start(definition, 'hello')

    await waitFor(() => calls.started === 1)
    const [runId] = await looms.listRuns()
    const { rootThreadId } = await looms.getRun(runId!)

    const response = await looms.fetch(
      new Request(`http://looms.test/runs/${runId}/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ threadId: rootThreadId }),
      }),
    )

    expect(response?.status).toBe(200)
    await starting

    expect((await looms.getRun(runId!)).status).toBe('cancelled')
    await looms.stop()
  })
})
