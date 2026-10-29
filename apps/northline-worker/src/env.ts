import { createTypeSafeAi } from '@ai-sdk/typesafe-ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

import { deskLlm } from '@looms/northline'
import type { LlmAdapter } from '@swirls/looms/agent'
import { vercelEvaluator, vercelLlm } from '@swirls/looms/ai-vercel'
import type { EvaluatorAdapter } from '@swirls/looms/evaluator'

export interface Env {
  readonly LOOMS_RUN: DurableObjectNamespace
  readonly DESK: DurableObjectNamespace
  readonly RECOVERY_QUEUE: Queue
  readonly LOOMS_WORKER_TOKEN: string
  /** Hyperdrive binding. Production reaches Postgres through this, with prepared statements off. */
  readonly NORTHLINE_DB?: { readonly connectionString: string }
  /** Direct Postgres URL for local dev. Ignored when Hyperdrive is bound. */
  readonly DATABASE_URL?: string
  readonly OPENROUTER_API_KEY?: string
  readonly LOOMS_MODEL?: string
  readonly TYPESAFE_AI_API_KEY?: string
  readonly LOOMS_EVALUATOR_MODEL?: string
}

/** The desk model when a key is configured. Otherwise the deterministic stand-in. */
export function resolveLlm(env: Env): LlmAdapter {
  const apiKey = env.OPENROUTER_API_KEY

  if (!apiKey) {
    return deskLlm
  }

  return vercelLlm({
    model: createOpenRouter({ apiKey }).chat(env.LOOMS_MODEL ?? 'openai/gpt-4o-mini'),
    stream: true,
  })
}

/** TypeSafe when a key is configured. Otherwise the evaluator module keeps its stub. */
export function resolveEvaluator(env: Env): EvaluatorAdapter | undefined {
  const apiKey = env.TYPESAFE_AI_API_KEY

  if (!apiKey) {
    return undefined
  }

  return vercelEvaluator({
    provider: createTypeSafeAi({ apiKey }),
    model: env.LOOMS_EVALUATOR_MODEL ?? 'jev-latest',
  })
}
