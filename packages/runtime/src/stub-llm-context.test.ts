import { describe, expect, test } from 'bun:test'

import { agent, defineAgent, type StubLlmContext } from '@looms/agent'

import { createLooms } from './looms'

describe('scripted model', () => {
  test('sees the run, the agent and the model id it serves', async () => {
    const seen: StubLlmContext[] = []

    const clerk = defineAgent({
      name: 'clerk',
      version: '2',
      model: 'test-model',
      instructions: 'file it',
    })

    const looms = createLooms({
      modules: [
        agent({
          definitions: [clerk],
          llmPolicy: {
            toolCallsFor: (ctx) => {
              seen.push(ctx)

              return undefined
            },
          },
        }),
      ],
    })

    try {
      const { runId, threadId } = await looms.start(clerk, 'hello', {
        runId: 'run_clerk',
        attributes: { tenant: 'acme' },
      })

      expect(seen).toHaveLength(1)

      expect(seen[0]).toMatchObject({
        threadId,
        turn: 1,
        input: 'hello',
        instructions: 'file it',
        model: 'test-model',
        agent: { name: 'clerk', version: '2' },
        run: { runId, threadId, attributes: { tenant: 'acme' } },
      })
    } finally {
      await looms.stop()
    }
  })
})
