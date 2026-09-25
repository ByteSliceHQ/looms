import { experimental_evaluate } from 'ai'
import { Data, Effect, Predicate } from 'effect'

import type {
  EvaluatorAdapter,
  EvaluatorAnswer,
  EvaluatorAnswers,
  EvaluatorEvaluateResult,
  EvaluatorQuestions,
} from '@looms/evaluator'

const DEFAULT_EVALUATOR_MODEL = 'typesafe-ai/jev'

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

type EvaluateOptions = Parameters<typeof experimental_evaluate>[0]
type EvaluationModel = Exclude<EvaluateOptions['model'], string>

/** An AI SDK provider with evaluation models, such as `createTypeSafeAi({ apiKey })`. */
export interface EvaluationModelProvider {
  readonly evaluationModel: (modelId: string) => EvaluationModel
}

interface VercelEvaluatorBaseOptions {
  /** Abort the hosted call after this many milliseconds. Defaults to 2000. */
  readonly timeoutMs?: number
  /** Defaults to AI Gateway zero data retention when no `provider` is set. */
  readonly providerOptions?: EvaluateOptions['providerOptions']
}

export type VercelEvaluatorOptions = VercelEvaluatorBaseOptions &
  (
    | {
        /** AI Gateway model id. Defaults to TypeSafe Jev (`typesafe-ai/jev`). */
        readonly model?: string
        readonly provider?: undefined
      }
    | {
        /** Default model id for `provider`. A definition's own `model` takes precedence. */
        readonly model: string
        /** Resolves model ids with your own provider and key instead of the AI Gateway. */
        readonly provider: EvaluationModelProvider
      }
  )

interface EvaluateAnswer {
  readonly type?: 'boolean' | 'choice' | 'score'
  readonly probability?: number
  readonly choice?: string
  readonly score?: number
}

function abortSignalFor(timeoutMs: number, parent?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return parent ? AbortSignal.any([parent, timeout]) : timeout
}

/** Map `experimental_evaluate` answers onto evaluator answers. Boolean items only expose probability. */
export function toEvaluatorAnswers(
  questions: EvaluatorQuestions,
  raw: { readonly [name: string]: EvaluateAnswer | undefined },
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

  const providerOptions =
    options.providerOptions ??
    (options.provider ? undefined : { gateway: { zeroDataRetention: true } })

  function resolveModel(modelId: string | undefined): string | EvaluationModel {
    const id = modelId ?? options.model ?? DEFAULT_EVALUATOR_MODEL
    return options.provider ? options.provider.evaluationModel(id) : id
  }

  return {
    evaluate: (args): Promise<EvaluatorEvaluateResult> =>
      Effect.runPromise(
        Effect.tryPromise({
          try: () =>
            experimental_evaluate({
              model: resolveModel(args.model),
              state: args.state,
              abortSignal: abortSignalFor(timeoutMs, args.signal),
              maxRetries: 0,
              providerOptions,
              questions: args.questions,
            }),
          catch: (cause) => new VercelEvaluatorError(cause),
        }).pipe(
          Effect.map((result) => ({
            answers: toEvaluatorAnswers(args.questions, result.answers),
            usage: {
              input: result.usage.inputTokens ?? 0,
              output: result.usage.outputTokens ?? 0,
            },
            raw: result,
          })),
        ),
      ),
  }
}
