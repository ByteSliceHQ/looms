import type * as AiSdk from 'ai'
import { Data, Effect, Predicate } from 'effect'

import {
  TYPESAFE_JEV_MODEL,
  type EvaluatorAdapter,
  type EvaluatorAnswer,
  type EvaluatorAnswers,
  type EvaluatorEvaluateResult,
  type EvaluatorQuestions,
} from '@looms/evaluator'

class VercelEvaluatorError extends Data.TaggedError('VercelEvaluatorError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'VercelEvaluatorError'
  }
}

export interface VercelEvaluatorOptions {
  /** Model id understood by the AI SDK evaluate API. Defaults to TypeSafe Jev. */
  readonly model?: string
  /** Abort the hosted call after this many milliseconds. Defaults to 2000. */
  readonly timeoutMs?: number
  readonly providerOptions?: {
    readonly gateway?: { readonly zeroDataRetention?: boolean }
  }
}

export interface VercelJevOptions {
  /** Abort the hosted call after this many milliseconds. Defaults to 2000. */
  readonly timeoutMs?: number
  readonly providerOptions?: VercelEvaluatorOptions['providerOptions']
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
  readonly providerOptions?: VercelEvaluatorOptions['providerOptions']
  readonly questions: EvaluatorQuestions
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
    throw new VercelEvaluatorError(
      'Install ai@7.0.105 or later to use vercelEvaluator(); experimental_evaluate is required',
    )
  }

  return candidate
}

function abortSignalFor(timeoutMs: number, parent?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return parent ? AbortSignal.any([parent, timeout]) : timeout
}

/** Map `experimental_evaluate` answers onto evaluator answers. Boolean items only expose probability. */
export function toEvaluatorAnswers(
  questions: EvaluatorQuestions,
  raw: EvaluateResult['answers'],
): EvaluatorAnswers {
  const answers: { [name: string]: EvaluatorAnswer } = {}

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

export function vercelEvaluator(options: VercelEvaluatorOptions = {}): EvaluatorAdapter {
  const timeoutMs = options.timeoutMs ?? 2000
  const providerOptions = options.providerOptions ?? { gateway: { zeroDataRetention: true } }

  return {
    evaluate: (args): Promise<EvaluatorEvaluateResult> =>
      Effect.runPromise(
        Effect.gen(function* () {
          const mod = yield* Effect.tryPromise({
            try: () => import('ai'),
            catch: (cause) => new VercelEvaluatorError(cause),
          })

          const evaluate = loadEvaluate(mod)

          const result = yield* Effect.tryPromise({
            try: () =>
              evaluate({
                model: args.model ?? options.model ?? TYPESAFE_JEV_MODEL,
                state: args.state,
                abortSignal: abortSignalFor(timeoutMs, args.signal),
                maxRetries: 0,
                providerOptions,
                questions: args.questions,
              }),
            catch: (cause) => new VercelEvaluatorError(cause),
          })

          return {
            answers: toEvaluatorAnswers(args.questions, result.answers),
            usage: {
              input: result.usage?.inputTokens ?? 0,
              output: result.usage?.outputTokens ?? 0,
            },
            raw: result,
          }
        }),
      ),
  }
}

/** `vercelEvaluator` preset for the TypeSafe Jev model. */
export function vercelJev(options: VercelJevOptions = {}): EvaluatorAdapter {
  return vercelEvaluator({ ...options, model: TYPESAFE_JEV_MODEL })
}
