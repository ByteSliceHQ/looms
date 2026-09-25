import { createTypeSafeAi } from '@ai-sdk/typesafe-ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

import type { LlmAdapter } from '@swirls/looms/agent'
import { vercelEvaluator, vercelLlm } from '@swirls/looms/ai-vercel'
import type { EvaluatorAdapter } from '@swirls/looms/evaluator'
import type { Projector } from '@swirls/looms/projectors'
import { s2ConfigFromEnv, s2Projector } from '@swirls/looms/s2/projector'

import { demoLlm } from './demo-llm'

export interface DemoEnv {
  readonly OPENROUTER_API_KEY?: string
  readonly LOOMS_MODEL?: string
  readonly TYPESAFE_AI_API_KEY?: string
  readonly LOOMS_EVALUATOR_MODEL?: string
  readonly LOOMS_S2_ACCESS_TOKEN?: string
  readonly LOOMS_S2_BASIN?: string
  readonly LOOMS_S2_ENDPOINT?: string
}

/** Pick demo-relevant keys from process.env without asserting ProcessEnv shape. */
export function demoEnvFromProcess(env: NodeJS.ProcessEnv = process.env): DemoEnv {
  return {
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
    LOOMS_MODEL: env.LOOMS_MODEL,
    TYPESAFE_AI_API_KEY: env.TYPESAFE_AI_API_KEY,
    LOOMS_EVALUATOR_MODEL: env.LOOMS_EVALUATOR_MODEL,
    LOOMS_S2_ACCESS_TOKEN: env.LOOMS_S2_ACCESS_TOKEN,
    LOOMS_S2_BASIN: env.LOOMS_S2_BASIN,
    LOOMS_S2_ENDPOINT: env.LOOMS_S2_ENDPOINT,
  }
}

/** Shared OpenRouter / stub LLM used by both Bun and Cloudflare demo backends. */
export function resolveDemoLlm(env: DemoEnv = demoEnvFromProcess()): LlmAdapter {
  const openRouterKey = env.OPENROUTER_API_KEY
  const modelId = env.LOOMS_MODEL ?? 'openai/gpt-4o-mini'

  if (!openRouterKey) {
    return demoLlm
  }

  return vercelLlm({
    model: createOpenRouter({ apiKey: openRouterKey }).chat(modelId),
    stream: true,
  })
}

/** TypeSafe Jev with the caller's own key. Without a key the evaluator module uses its stub. */
export function resolveDemoEvaluator(
  env: DemoEnv = demoEnvFromProcess(),
): EvaluatorAdapter | undefined {
  const apiKey = env.TYPESAFE_AI_API_KEY

  if (!apiKey) {
    return undefined
  }

  return vercelEvaluator({
    provider: createTypeSafeAi({ apiKey }),
    model: env.LOOMS_EVALUATOR_MODEL ?? 'jev-latest',
  })
}

/** Optional S2 projector when basin/token/endpoint env is present. */
export function resolveDemoProjectors(env: DemoEnv = demoEnvFromProcess()): Projector[] {
  if (!env.LOOMS_S2_ENDPOINT && !env.LOOMS_S2_ACCESS_TOKEN) {
    return []
  }

  return [
    s2Projector(
      s2ConfigFromEnv({
        LOOMS_S2_ACCESS_TOKEN: env.LOOMS_S2_ACCESS_TOKEN,
        LOOMS_S2_BASIN: env.LOOMS_S2_BASIN,
        LOOMS_S2_ENDPOINT: env.LOOMS_S2_ENDPOINT,
      }),
    ),
  ]
}
