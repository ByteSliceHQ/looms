import { vercelLlm } from '@looms/ai-vercel'
import { createLooms } from '@looms/runtime'
import { s2, s2ConfigFromEnv, s2Lite } from '@looms/s2'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { definitions } from './definitions'

const openRouterKey = process.env.OPENROUTER_API_KEY
const modelId = process.env.LOOMS_MODEL ?? 'openai/gpt-4o-mini'

export const looms = createLooms({
  definitions,
  store: process.env.LOOMS_S2_ENDPOINT
    ? s2(s2ConfigFromEnv(process.env))
    : s2Lite({ env: process.env }),
  llm: openRouterKey
    ? vercelLlm({
        model: createOpenRouter({ apiKey: openRouterKey }).chat(modelId),
        stream: true,
      })
    : undefined,
})
