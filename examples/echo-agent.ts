import { z } from 'zod'

import { agent, defineAgent } from '@looms/agent'
import { createLooms } from '@looms/runtime'

// Minimal agent host: one definition, one module, start a run.
// bun run --filter @looms/examples echo-agent

const echo = defineAgent({
  name: 'echo',
  instructions: 'Echo the user.',
  input: z.object({ text: z.string() }),
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: input.text },
    done: true,
    output: { text: input.text },
  }),
})

const looms = createLooms({
  modules: [agent({ definitions: [echo] })],
})

const { runId, state } = await looms.start(echo, { text: 'hello' })

console.log('runId:', runId)
console.log('status:', state.status)
console.log('output:', state.rootThreadId ? state.threads[state.rootThreadId]?.output : null)

await looms.stop()
