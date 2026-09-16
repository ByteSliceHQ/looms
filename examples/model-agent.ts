import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'

import { agent, defineAgent, defineTool } from '@looms/agent'
import { vercelLlm } from '@looms/ai-vercel'
import { createLooms } from '@looms/runtime'

const apiKey = process.env.OPENROUTER_API_KEY
const modelId = process.env.LOOMS_MODEL

if (!apiKey || !modelId) {
  throw new Error('Set OPENROUTER_API_KEY and LOOMS_MODEL')
}

const llm = vercelLlm({ model: createOpenRouter({ apiKey }).chat(modelId) })

const greeting = defineTool({
  name: 'greeting',
  description: 'Build a greeting for a person.',
  input: z.object({ name: z.string() }),
  handler: ({ name }) => ({ text: 'Hello, ' + name }),
})

const assistant = defineAgent({
  name: 'assistant',
  instructions: 'Use the greeting tool, then return its result.',
  input: z.string(),
  tools: [greeting],
  maxTurns: 4,
})

const looms = createLooms({ modules: [agent({ definitions: [assistant], llm })] })

try {
  const { runId } = await looms.start(assistant, 'Greet Maya')
  console.log(await looms.getEvents(runId))
} finally {
  await looms.stop()
}
