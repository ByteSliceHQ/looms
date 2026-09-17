import type * as AiSdk from 'ai'
import { Data, Effect, Predicate } from 'effect'

import type { JevAdapter, JevAnswer, JevAnswers, JevEvaluateResult, JevQuestions } from '@looms/jev'

class VercelJevError extends Data.TaggedError('VercelJevError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'VercelJevError'
  }
}

export interface VercelJevOptions {
  readonly model?: string
  /** Abort the hosted call after this many milliseconds. Defaults to 2000. */
  readonly timeoutMs?: number
}

interface EvaluateAnswer {
  readonly type?: string
  readonly probability?: number
  readonly choice?: string
  readonly score?: number
}

interface EvaluateResult {
  readonly answers: { readonly [name: string]: EvaluateAnswer }
  readonly usage?: { readonly inputTokens?: number; readonly outputTokens?: number }
}

type EvaluateFn = (args: {
  readonly model: string
  readonly state: string
  readonly abortSignal?: AbortSignal
  readonly maxRetries?: number
  readonly providerOptions?: { readonly gateway?: { readonly zeroDataRetention?: boolean } }
  readonly questions: JevQuestions
}) => Promise<EvaluateResult>

function isEvaluateFn(value: unknown): value is EvaluateFn {
  return Predicate.isFunction(value)
}

function readEvaluateExport(mod: typeof AiSdk, name: string): EvaluateFn | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(mod, name)

  if (!descriptor) {
    return undefined
  }

  const value = descriptor.get ? descriptor.get.call(mod) : descriptor.value

  return isEvaluateFn(value) ? value : undefined
}

function loadEvaluate(mod: typeof AiSdk): EvaluateFn {
  const candidate =
    readEvaluateExport(mod, 'experimental_evaluate') ?? readEvaluateExport(mod, 'evaluate')

  if (!candidate) {
    throw new VercelJevError(
      'Install ai@7.0.105 or later to use vercelJev(); experimental_evaluate is required',
    )
  }

  return candidate
}

function abortSignalFor(timeoutMs: number, parent?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return parent ? AbortSignal.any([parent, timeout]) : timeout
}

/** Map `experimental_evaluate` answers onto Looms JevAnswers. Boolean items only expose probability. */
export function toJevAnswers(questions: JevQuestions, raw: EvaluateResult['answers']): JevAnswers {
  const answers: { [name: string]: JevAnswer } = {}

  for (const [name, question] of Object.entries(questions)) {
    const item = raw[name]

    if (question.type === 'boolean') {
      const probability = Predicate.isNumber(item?.probability) ? item.probability : 0

      answers[name] = {
        type: 'boolean',
        value: probability >= 0.5,
        probability,
      }

      continue
    }

    if (question.type === 'choice') {
      answers[name] = {
        type: 'choice',
        value: Predicate.isString(item?.choice) ? item.choice : '',
      }

      continue
    }

    answers[name] = {
      type: 'score',
      value: Predicate.isNumber(item?.score) ? item.score : 0,
    }
  }

  return answers
}

export function vercelJev(options: VercelJevOptions = {}): JevAdapter {
  const timeoutMs = options.timeoutMs ?? 2000

  return {
    evaluate: (args): Promise<JevEvaluateResult> =>
      Effect.runPromise(
        Effect.gen(function* () {
          const mod = yield* Effect.tryPromise({
            try: () => import('ai'),
            catch: (cause) => new VercelJevError(cause),
          })

          const evaluate = loadEvaluate(mod)

          const result = yield* Effect.tryPromise({
            try: () =>
              evaluate({
                model: args.model ?? options.model ?? 'typesafe-ai/jev',
                state: args.state,
                abortSignal: abortSignalFor(timeoutMs, args.signal),
                maxRetries: 0,
                providerOptions: { gateway: { zeroDataRetention: true } },
                questions: args.questions,
              }),
            catch: (cause) => new VercelJevError(cause),
          })

          return {
            answers: toJevAnswers(args.questions, result.answers),
            usage: {
              input: result.usage?.inputTokens ?? 0,
              output: result.usage?.outputTokens ?? 0,
            },
          }
        }),
      ),
  }
}
