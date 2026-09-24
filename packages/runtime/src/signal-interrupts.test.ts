import { describe, expect, test } from 'bun:test'

import { agent, defineAgent, steer } from '@looms/agent'

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
})
