import { describe, expect, test } from 'bun:test'

import {
  agent,
  cancelActiveAgentTurn,
  defineAgent,
  defineAgentSession,
  sendAgentSessionMessage,
} from '@looms/agent'

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

describe('run execution isolation', () => {
  test('cancelling a reused thread id aborts effects only in the target run', async () => {
    const aborted = [false, false]
    let invocation = 0

    const assistant = defineAgent({
      name: 'isolated-assistant',
      instructions: 'wait until cancelled',
      runTurn: ({ signal }) => {
        const index = invocation++

        return new Promise((_, reject) => {
          signal?.addEventListener(
            'abort',
            () => {
              aborted[index] = true
              reject(signal.reason)
            },
            { once: true },
          )
        })
      },
    })

    const session = defineAgentSession({ name: 'isolated-session', agent: assistant })
    const looms = createLooms({ modules: [agent({ definitions: [assistant, session] })] })
    const sharedThreadId = 'shared-thread'
    const firstRun = await looms.start(session, undefined, { threadId: sharedThreadId })
    const firstSend = sendAgentSessionMessage(looms, firstRun.runId, 'same-message', 'wait')

    await waitFor(() => invocation === 1)

    const secondRun = await looms.start(session, undefined, { threadId: sharedThreadId })
    const secondSend = sendAgentSessionMessage(looms, secondRun.runId, 'same-message', 'wait')

    await waitFor(() => invocation === 2)
    await cancelActiveAgentTurn(looms, firstRun.runId)
    await waitFor(() => aborted[0] === true)

    expect(aborted[1]).toBe(false)

    await cancelActiveAgentTurn(looms, secondRun.runId)
    await waitFor(() => aborted[1] === true)
    await Promise.allSettled([firstSend, secondSend])
    await looms.stop()
  })
})
