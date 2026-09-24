import { Data, Effect, Option, Schema } from 'effect'

import { stringifyJson, validateInputEffect, type EventInputOf, type JsonValue } from '@looms/core'

import { EvaluatorDefinitionsTag } from './definitions-store'
import { EvaluatorTag } from './evaluator'
import { evaluatorModule, type EvaluatorEvent } from './scope'
import {
  EvaluatorQuestionsSchema,
  type EvaluatorAnswers,
  type EvaluatorEvaluateResult,
  type EvaluatorQuestions,
  type EvaluatorReason,
  type EvaluatorRoute,
  type EvaluatorRouteDecision,
  type EvaluatorSkipResult,
  type ResolvedEvaluatorDecision,
} from './types'

const EvaluateInput = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  input: Schema.optional(Schema.Json),
  state: Schema.optional(Schema.String),
  questions: Schema.optional(Schema.Json),
  model: Schema.optional(Schema.String),
})

class EvaluatorExecutionError extends Data.TaggedError('EvaluatorExecutionError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'EvaluatorExecutionError'
  }
}

const decodeQuestions = Schema.decodeUnknownOption(EvaluatorQuestionsSchema)

function readQuestions(value: JsonValue | undefined): EvaluatorQuestions | undefined {
  if (value === undefined) {
    return undefined
  }

  const decoded = decodeQuestions(value)
  return Option.isSome(decoded) ? decoded.value : undefined
}

function emptyAnswers(): EvaluatorAnswers {
  return {}
}

function fallbackDecision(
  reason: EvaluatorReason,
  route: EvaluatorRoute = 'continue',
): ResolvedEvaluatorDecision {
  return { route, reason }
}

function mergeDecision(
  base: EvaluatorRouteDecision,
  extra: EvaluatorRouteDecision | EvaluatorSkipResult | undefined,
): ResolvedEvaluatorDecision {
  const route = extra?.route ?? base.route
  const reason: EvaluatorReason = extra?.reason ?? base.reason ?? 'model'

  return { route, reason }
}

function failed(threadId: string, error: string): EventInputOf<EvaluatorEvent>[] {
  return [
    {
      type: 'runtime.thread.failed',
      payload: { threadId, error },
      threadId,
    },
  ]
}

export const evaluateEffect = evaluatorModule.effect({
  type: 'evaluator.evaluate',
  input: EvaluateInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const threadId = ctx.threadId
      const definitions = yield* EvaluatorDefinitionsTag
      const evaluator = yield* EvaluatorTag
      const definition = input.definitionName ? definitions.get(input.definitionName) : undefined

      if (input.definitionName && !definition) {
        return failed(threadId, `Unknown evaluator definition for ${input.definitionName}`)
      }

      const rawInput = input.input ?? null
      let subject: JsonValue = rawInput

      if (definition?.input) {
        const validated = yield* validateInputEffect(definition.input, rawInput).pipe(
          Effect.match({
            onFailure: (error) => ({ ok: false as const, error: error.message }),
            onSuccess: (value) => ({ ok: true as const, value }),
          }),
        )

        if (!validated.ok) {
          return failed(threadId, validated.error)
        }

        subject = validated.value
      }

      const questions = definition?.questions ?? readQuestions(input.questions)

      if (!questions || Object.keys(questions).length === 0) {
        return failed(threadId, 'Evaluator is missing questions')
      }

      const renderState = definition?.state

      const stateText = renderState
        ? yield* Effect.try({
            try: () => renderState(subject),
            catch: (cause) => new EvaluatorExecutionError(cause),
          }).pipe(
            Effect.match({
              onFailure: (error) => ({ ok: false as const, error: error.message }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )
        : {
            ok: true as const,
            value: input.state ?? stringifyJson(subject),
          }

      if (!stateText.ok) {
        return failed(threadId, stateText.error)
      }

      const events: EventInputOf<EvaluatorEvent>[] = [
        {
          type: 'evaluator.requested',
          payload: {
            evaluationId: input.evaluationId,
            definitionName: input.definitionName,
            state: stateText.value,
            questions: input.definitionName ? undefined : questions,
            model: input.model ?? definition?.model,
          },
          threadId,
        },
      ]

      const skipModel = definition?.skipModel

      const skipped = skipModel
        ? yield* Effect.try({
            try: () => skipModel(subject),
            catch: (cause) => new EvaluatorExecutionError(cause),
          }).pipe(
            Effect.match({
              onFailure: (error) => ({ ok: false as const, error: error.message }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )
        : { ok: true as const, value: undefined }

      if (!skipped.ok) {
        return failed(threadId, skipped.error)
      }

      let answers: EvaluatorAnswers = emptyAnswers()
      let usage: EvaluatorEvaluateResult['usage']
      let decision = fallbackDecision('unavailable')

      if (skipped.value) {
        answers = skipped.value.answers ?? emptyAnswers()

        decision = mergeDecision(
          fallbackDecision(skipped.value.reason, skipped.value.route),
          skipped.value,
        )
      } else {
        const evaluated = yield* evaluator
          .evaluate({
            model: input.model ?? definition?.model,
            state: stateText.value,
            questions,
            options: definition?.options,
          })
          .pipe(
            Effect.match({
              onFailure: () => ({ ok: false as const }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )

        if (!evaluated.ok) {
          decision = fallbackDecision('unavailable')
        } else {
          answers = evaluated.value.answers
          usage = evaluated.value.usage

          const route = definition?.route

          decision = route
            ? mergeDecision(
                { route: 'continue', reason: 'model' },
                route({ answers, input: subject }),
              )
            : { route: 'continue', reason: 'model' }
        }
      }

      events.push({
        type: 'evaluator.evaluated',
        payload: {
          evaluationId: input.evaluationId,
          definitionName: input.definitionName,
          answers,
          route: decision.route,
          reason: decision.reason,
          usage,
        },
        threadId,
      })

      return events
    }),
})
