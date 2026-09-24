import { Context, Data, Effect, Layer } from 'effect'

import type { EvaluatorAdapter } from './types'

export class EvaluatorError extends Data.TaggedError('EvaluatorError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'EvaluatorError'
  }
}

export interface EvaluatorService {
  readonly evaluate: (
    args: Parameters<EvaluatorAdapter['evaluate']>[0],
  ) => Effect.Effect<Awaited<ReturnType<EvaluatorAdapter['evaluate']>>, EvaluatorError>
}

export function evaluatorFromAdapter(adapter: EvaluatorAdapter): EvaluatorService {
  return {
    evaluate: (args) =>
      Effect.tryPromise({
        try: () => adapter.evaluate(args),
        catch: (cause) => new EvaluatorError(cause),
      }),
  }
}

export class EvaluatorTag extends Context.Service<EvaluatorTag, EvaluatorService>()(
  'looms/Evaluator',
) {}

export interface StubEvaluatorPolicy {
  evaluate?: EvaluatorAdapter['evaluate']
}

function defaultStubEvaluate(args: Parameters<EvaluatorAdapter['evaluate']>[0]) {
  const text = args.state.toLowerCase()
  const high = /\b(error|fail|fatal|dispute|urgent)\b/.test(text)
  const low = /\b(routine|resolved|duplicate)\b/.test(text)

  const answers = Object.fromEntries(
    Object.entries(args.questions).map(([name, question]) => {
      if (question.type === 'boolean') {
        return [
          name,
          {
            type: 'boolean' as const,
            value: high,
            probability: high ? 0.95 : low ? 0.02 : 0.4,
          },
        ]
      }

      if (question.type === 'choice') {
        const allowed = Object.keys(question.criteria)
        const preferred = high ? ['critical', 'high'] : low ? ['low'] : ['normal']
        const value = preferred.find((item) => allowed.includes(item)) ?? allowed[0] ?? 'low'

        return [
          name,
          {
            type: 'choice' as const,
            value,
          },
        ]
      }

      return [
        name,
        {
          type: 'score' as const,
          value: high ? 4 : low ? 0 : 2,
        },
      ]
    }),
  )

  return {
    answers,
    usage: { input: 0, output: 0 },
  }
}

export const makeStubEvaluator = (policy: StubEvaluatorPolicy = {}): EvaluatorService => ({
  evaluate: (args) =>
    Effect.tryPromise({
      try: () => Promise.resolve((policy.evaluate ?? defaultStubEvaluate)(args)),
      catch: (cause) => new EvaluatorError(cause),
    }),
})

export const StubEvaluatorLive = (policy?: StubEvaluatorPolicy) =>
  Layer.succeed(EvaluatorTag, makeStubEvaluator(policy))
