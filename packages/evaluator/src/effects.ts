import { Effect, Schema } from 'effect'

import { stringifyJson, validateInputEffect, type EventInputOf, type JsonValue } from '@looms/core'

import { EvaluatorDefinitionsTag } from './definitions-store'
import { EvaluatorTag } from './evaluator'
import { evaluatorModule, type EvaluatorEvent } from './scope'
import type {
  EvaluatorAnswers,
  EvaluatorEvaluateResult,
  ResolvedEvaluatorDecision,
} from './types'

const EvaluateInput = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  input: Schema.optional(Schema.Json),
})

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function capture<A>(run: () => A) {
  return Effect.try({
    try: run,
    catch: errorMessage,
  }).pipe(
    Effect.match({
      onFailure: (error) => ({ ok: false as const, error }),
      onSuccess: (value) => ({ ok: true as const, value }),
    }),
  )
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

      if (!definition) {
        const name = input.definitionName ?? 'unknown'

        return failed(threadId, `Unknown evaluator definition for ${name}`)
      }

      const rawInput = input.input ?? null

      const validated = definition.input
        ? yield* validateInputEffect(definition.input, rawInput).pipe(
            Effect.match({
              onFailure: (error) => ({ ok: false as const, error: error.message }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )
        : { ok: true as const, value: rawInput }

      if (!validated.ok) {
        return failed(threadId, validated.error)
      }

      const subject: JsonValue = validated.value

      if (Object.keys(definition.questions).length === 0) {
        return failed(threadId, 'Evaluator is missing questions')
      }

      const renderState = definition.state

      const stateText = renderState
        ? yield* capture(() => renderState(subject))
        : { ok: true as const, value: stringifyJson(subject) }

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
            model: definition.model,
          },
          threadId,
        },
      ]

      const skipModel = definition.skipModel

      const skipped = skipModel
        ? yield* capture(() => skipModel(subject))
        : { ok: true as const, value: undefined }

      if (!skipped.ok) {
        return failed(threadId, skipped.error)
      }

      let answers: EvaluatorAnswers = {}
      let usage: EvaluatorEvaluateResult['usage']
      let decision: ResolvedEvaluatorDecision = { route: 'continue', reason: 'unavailable' }

      if (skipped.value) {
        answers = skipped.value.answers ?? {}
        decision = { route: skipped.value.route, reason: skipped.value.reason }
      } else {
        const evaluated = yield* evaluator
          .evaluate({
            model: definition.model,
            state: stateText.value,
            questions: definition.questions,
          })
          .pipe(
            Effect.match({
              onFailure: () => ({ ok: false as const }),
              onSuccess: (value) => ({ ok: true as const, value }),
            }),
          )

        if (evaluated.ok) {
          answers = evaluated.value.answers
          usage = evaluated.value.usage

          const route = definition.route

          if (route) {
            const routed = yield* capture(() => route({ answers, input: subject }))

            if (!routed.ok) {
              return failed(threadId, routed.error)
            }

            decision = { route: routed.value.route, reason: routed.value.reason ?? 'model' }
          } else {
            decision = { route: 'continue', reason: 'model' }
          }
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
