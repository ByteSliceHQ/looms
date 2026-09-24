import { describe, expect, test } from 'bun:test'

import { agent, defineAgent } from '@looms/agent'

import { createLooms } from './looms'
import type { RuntimeObservation } from './observer'
import { bearerAuth } from './server'

describe('createLooms production facade', () => {
  test('exposes observation, inspection, deadline recovery, and protected operations', async () => {
    const observations: RuntimeObservation[] = []

    const echo = defineAgent({
      name: 'facade-echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })

    const looms = createLooms({
      modules: [agent({ definitions: [echo] })],
      observer: { observe: (event) => observations.push(event) },
      authorize: bearerAuth({ operations: 'operations-secret' }),
    })

    const started = await looms.start(echo, { value: 1 })
    const inspected = await looms.inspectRun(started.runId)

    expect(inspected.runId).toBe(started.runId)
    expect(await looms.listRuns()).toContain(started.runId)
    expect(observations.some((event) => event.type === 'run.start')).toBe(true)
    expect(await looms.recoverDeadlines()).toBe(0)

    const unauthorized = await looms.fetch(
      new Request('http://looms.test/operations/deadlines/rescan', { method: 'POST' }),
    )

    expect(unauthorized?.status).toBe(401)

    const authorized = await looms.fetch(
      new Request('http://looms.test/operations/deadlines/rescan', {
        method: 'POST',
        headers: { authorization: 'Bearer operations-secret' },
      }),
    )

    expect(authorized?.status).toBe(200)
    await looms.stop()
  })
})
