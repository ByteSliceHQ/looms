import { Schema } from 'effect'

import type { JsonValue } from '@looms/core'

export const BooleanQuestionSchema = Schema.Struct({
  type: Schema.Literal('boolean'),
  instructions: Schema.String,
})
export type BooleanQuestion = Schema.Schema.Type<typeof BooleanQuestionSchema>

export const ChoiceQuestionSchema = Schema.Struct({
  type: Schema.Literal('choice'),
  instructions: Schema.String,
  criteria: Schema.Record(Schema.String, Schema.String),
})
export type ChoiceQuestion = Schema.Schema.Type<typeof ChoiceQuestionSchema>

export const ScoreQuestionSchema = Schema.Struct({
  type: Schema.Literal('score'),
  instructions: Schema.String,
  criteria: Schema.Array(Schema.String),
})
export type ScoreQuestion = Schema.Schema.Type<typeof ScoreQuestionSchema>

export const EvaluatorQuestionSchema = Schema.Union([
  BooleanQuestionSchema,
  ChoiceQuestionSchema,
  ScoreQuestionSchema,
])
export type EvaluatorQuestion = Schema.Schema.Type<typeof EvaluatorQuestionSchema>

export const EvaluatorQuestionsSchema = Schema.Record(Schema.String, EvaluatorQuestionSchema)
export type EvaluatorQuestions = Schema.Schema.Type<typeof EvaluatorQuestionsSchema>

export const BooleanAnswerSchema = Schema.Struct({
  type: Schema.Literal('boolean'),
  value: Schema.Boolean,
  probability: Schema.Finite,
})
export type BooleanAnswer = Schema.Schema.Type<typeof BooleanAnswerSchema>

export const ChoiceAnswerSchema = Schema.Struct({
  type: Schema.Literal('choice'),
  value: Schema.String,
})
export type ChoiceAnswer = Schema.Schema.Type<typeof ChoiceAnswerSchema>

export const ScoreAnswerSchema = Schema.Struct({
  type: Schema.Literal('score'),
  value: Schema.Finite,
})
export type ScoreAnswer = Schema.Schema.Type<typeof ScoreAnswerSchema>

export const EvaluatorAnswerSchema = Schema.Union([
  BooleanAnswerSchema,
  ChoiceAnswerSchema,
  ScoreAnswerSchema,
])
export type EvaluatorAnswer = Schema.Schema.Type<typeof EvaluatorAnswerSchema>

export const EvaluatorAnswersSchema = Schema.Record(Schema.String, EvaluatorAnswerSchema)
export type EvaluatorAnswers = Schema.Schema.Type<typeof EvaluatorAnswersSchema>

export const EvaluatorRouteSchema = Schema.String
export type EvaluatorRoute = Schema.Schema.Type<typeof EvaluatorRouteSchema>

export const EvaluatorReasonSchema = Schema.Union([
  Schema.Literal('model'),
  Schema.Literal('uncertain'),
  Schema.Literal('skipped'),
  Schema.Literal('unavailable'),
])
export type EvaluatorReason = Schema.Schema.Type<typeof EvaluatorReasonSchema>

export const EvaluatorUsageSchema = Schema.Struct({
  input: Schema.Finite,
  output: Schema.Finite,
})
export type EvaluatorUsage = Schema.Schema.Type<typeof EvaluatorUsageSchema>

export interface EvaluatorEvaluateArgs {
  readonly model?: string
  readonly state: string
  readonly questions: EvaluatorQuestions
  readonly signal?: AbortSignal
  readonly options?: { readonly [key: string]: JsonValue }
}

export interface EvaluatorEvaluateResult {
  readonly answers: EvaluatorAnswers
  readonly usage?: EvaluatorUsage
  readonly raw?: unknown
}

export interface EvaluatorAdapter {
  readonly evaluate: (args: EvaluatorEvaluateArgs) => Promise<EvaluatorEvaluateResult>
}

export interface EvaluatorSkipResult {
  readonly route: string
  readonly reason: 'skipped' | 'unavailable'
  readonly answers?: EvaluatorAnswers
}

export interface EvaluatorRouteDecision {
  readonly route: string
  readonly reason?: EvaluatorReason
}

export interface ResolvedEvaluatorDecision {
  readonly route: string
  readonly reason: EvaluatorReason
}

export interface EvaluatorRouteArgs {
  readonly answers: EvaluatorAnswers
  readonly input: JsonValue
}
