import { z } from 'zod'

import { agent, defineAgent } from '@looms/agent'
import { createLooms } from '@looms/runtime'
import { defineWorkflow, workflow } from '@looms/workflow'

// DAG workflow: nodes with deps, and a child agent spawn.
// bun run --filter @looms/examples workflow

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

const pipeline = defineWorkflow({
  name: 'pipeline',
  input: z.object({ n: z.number().default(21) }),
  nodes: [
    {
      id: 'double',
      run: (ctx) => ctx.input.n * 2,
    },
    {
      id: 'spawn',
      deps: ['double'],
      run: (ctx) =>
        ctx.spawn(echo, {
          text: `n=${JSON.stringify(ctx.results.double ?? null)}`,
        }),
    },
    {
      id: 'format',
      deps: ['spawn'],
      run: (ctx) => ({
        doubled: ctx.results.double ?? null,
        child: ctx.results.spawn ?? null,
      }),
    },
  ],
  output: ({ results }) => results.format ?? null,
})

const looms = createLooms({
  // Both modules are required: the workflow spawns an agent child.
  modules: [agent({ definitions: [echo] }), workflow({ definitions: [pipeline] })],
})

const { runId, state } = await looms.start(pipeline, { n: 21 })

console.log('runId:', runId)
console.log('status:', state.status)
console.log('output:', state.rootThreadId ? state.threads[state.rootThreadId]?.output : null)

console.log(
  'threads:',
  Object.values(state.threads).map((t) => `${t.definitionName}:${t.status}`),
)

await looms.stop()
