import { describe, expect, test } from 'bun:test'
import { defineAgent } from '@looms/agent'
import { createLooms } from './looms'

describe('createLooms', () => {
  test('runs a deterministic echo agent to completion', async () => {
    const echo = defineAgent({
      name: 'echo',
      instructions: 'echo',
      runTurn: ({ input }) => ({
        message: { role: 'assistant', content: JSON.stringify(input) },
        done: true,
        output: input,
      }),
    })
    const looms = createLooms({ definitions: [echo] })
    const result = await looms.start(echo, { text: 'hi' })
    expect(result.state.status).toBe('completed')
    const root = result.state.rootThreadId
      ? result.state.threads[result.state.rootThreadId]
      : undefined
    expect(root?.status).toBe('completed')
    expect(root?.output).toEqual({ text: 'hi' })
  })
})
