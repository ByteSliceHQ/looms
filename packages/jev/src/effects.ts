import { Data, Effect, Option, Schema } from 'effect'

import { stringifyJson, validateInputEffect, type EventInputOf, type JsonValue } from '@looms/core'

import { JevDefinitionsTag } from './definitions-store'
import { JevTag } from './evaluator'
import { jevModule, type JevEvent } from './scope'
import {
  JevQuestionsSchema,
  type JevAnswers,
  type JevEvaluateResult,
  type JevQuestions,
  type JevReason,
  type JevRoute,
  type JevRouteDecision,
  type JevSkipResult,
  type ResolvedJevDecision,
} from './types'

const EvaluateInput = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  input: Schema.optional(Schema.Json),
  state: Schema.optional(Schema.String),
  questions: Schema.optional(Schema.Json),
  model: Schema.optional(Schema.String),
})

class JevExecutionError extends Data.TaggedError('JevExecutionError')<{
  readonly cause: unknown
  readonly message: string
}> {
  constructor(cause: unknown) {
    super({
      cause,
      message: cause instanceof Error ? cause.message : String(cause),
    })

    this.name = 'JevExecutionError'
  }
}

const decodeQuestions = Schema.decodeUnknownOption(JevQuestionsSchema)

function readQuestions(value: JsonValue | undefined): JevQuestions | undefined {
  if (value === undefined) {
    return undefined
  }

  const decoded = decodeQuestions(value)
  return Option.isSome(decoded) ? decoded.value : undefined
}

function emptyAnswers(): JevAnswers {
  return {}
}

function fallbackDecision(reason: JevReason, route: JevRoute = 'continue'): ResolvedJevDecision {
  return { route, reason }
}

function mergeDecision(
  base: JevRouteDecision,
  extra: JevRouteDecision | JevSkipResult | undefined,
): ResolvedJevDecision {
  const route = extra?.route ?? base.route
  const reason: JevReason = extra?.reason ?? base.reason ?? 'model'

  return { route, reason }
}

export const evaluateEffect = jevModule.effect({
  type: 'jev.evaluate',
  input: EvaluateInput,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const threadId = ctx.threadId
      const definitions = yield* JevDefinitionsTag
      const jev = yield* JevTag
      const definition = input.definitionName ? definitions.get(input.definitionName) : undefined

      if (input.definitionName && !definition) {
        return [
          {
            type: 'runtime.thread.failed',
            payload: {
              threadId,
              error: `Unknown jev definition for ${input.definitionName}`,
            },
            threadId,
          },
        ]
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
          return [
            {
              type: 'runtime.thread.failed',
              payload: { threadId, error: validated.error },
              threadId,
            },
          ]
        }

        subject = validated.value
      }

      const questions = definition?.questions ?? readQuestions(input.questions)

      if (!questions || Object.keys(questions).length === 0) {
        return [
          {
            type: 'runtime.thread.failed',
            payload: { threadId, error: 'Jev evaluation is missing questions' },
            threadId,
          },
        ]
      }

      const stateText = definition?.state
        ? yield* Effect.try({
            try: () => definition.state!(subject),
            catch: (cause) => new JevExecutionError(cause),
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
        return [
          {
            type: 'runtime.thread.failed',
            payload: { threadId, error: stateText.error },
            threadId,
          },
        ]
      }

      const events: EventInputOf<JevEvent>[] = [
        {
          type: 'jev.requested',
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

      const skipped = definition?.skipModel
        ? yield* Effect.try({
            try: () => definition.skipModel!(subject),
            catch: (cause) => new JevExecutionError(cause),
          }).pipe(
            Effect.match({
              onFailure: (error) => ({ ok: false as const, error: error.message }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )
        : { ok: true as const, value: undefined }

      if (!skipped.ok) {
        return [
          {
            type: 'runtime.thread.failed',
            payload: { threadId, error: skipped.error },
            threadId,
          },
        ]
      }

      let answers: JevAnswers = emptyAnswers()
      let usage: JevEvaluateResult['usage']
      let decision = fallbackDecision('unavailable')

      if (skipped.value) {
        answers = skipped.value.answers ?? emptyAnswers()

        decision = mergeDecision(
          fallbackDecision(skipped.value.reason, skipped.value.route),
          skipped.value,
        )
      } else {
        const evaluated = yield* jev
          .evaluate({
            model: input.model ?? definition?.model,
            state: stateText.value,
            questions,
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

          decision = definition?.route
            ? mergeDecision(
                { route: 'continue', reason: 'model' },
                definition.route({ answers, input: subject }),
              )
            : { route: 'continue', reason: 'model' }
        }
      }

      events.push({
        type: 'jev.evaluated',
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
