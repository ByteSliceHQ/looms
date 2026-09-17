import { Schema } from 'effect'

import type { JsonValue } from '@looms/core'

export const JevBooleanQuestionSchema = Schema.Struct({
  type: Schema.Literal('boolean'),
  instructions: Schema.String,
})
export type JevBooleanQuestion = Schema.Schema.Type<typeof JevBooleanQuestionSchema>

export const JevChoiceQuestionSchema = Schema.Struct({
  type: Schema.Literal('choice'),
  instructions: Schema.String,
  criteria: Schema.Record(Schema.String, Schema.String),
})
export type JevChoiceQuestion = Schema.Schema.Type<typeof JevChoiceQuestionSchema>

export const JevScoreQuestionSchema = Schema.Struct({
  type: Schema.Literal('score'),
  instructions: Schema.String,
  criteria: Schema.Array(Schema.String),
})
export type JevScoreQuestion = Schema.Schema.Type<typeof JevScoreQuestionSchema>

export const JevQuestionSchema = Schema.Union([
  JevBooleanQuestionSchema,
  JevChoiceQuestionSchema,
  JevScoreQuestionSchema,
])
export type JevQuestion = Schema.Schema.Type<typeof JevQuestionSchema>

export const JevQuestionsSchema = Schema.Record(Schema.String, JevQuestionSchema)
export type JevQuestions = Schema.Schema.Type<typeof JevQuestionsSchema>

export const JevBooleanAnswerSchema = Schema.Struct({
  type: Schema.Literal('boolean'),
  value: Schema.Boolean,
  probability: Schema.Finite,
})
export type JevBooleanAnswer = Schema.Schema.Type<typeof JevBooleanAnswerSchema>

export const JevChoiceAnswerSchema = Schema.Struct({
  type: Schema.Literal('choice'),
  value: Schema.String,
})
export type JevChoiceAnswer = Schema.Schema.Type<typeof JevChoiceAnswerSchema>

export const JevScoreAnswerSchema = Schema.Struct({
  type: Schema.Literal('score'),
  value: Schema.Finite,
})
export type JevScoreAnswer = Schema.Schema.Type<typeof JevScoreAnswerSchema>

export const JevAnswerSchema = Schema.Union([
  JevBooleanAnswerSchema,
  JevChoiceAnswerSchema,
  JevScoreAnswerSchema,
])
export type JevAnswer = Schema.Schema.Type<typeof JevAnswerSchema>

export const JevAnswersSchema = Schema.Record(Schema.String, JevAnswerSchema)
export type JevAnswers = Schema.Schema.Type<typeof JevAnswersSchema>

export const JevRouteSchema = Schema.String
export type JevRoute = Schema.Schema.Type<typeof JevRouteSchema>

export const JevReasonSchema = Schema.Union([
  Schema.Literal('model'),
  Schema.Literal('uncertain'),
  Schema.Literal('skipped'),
  Schema.Literal('unavailable'),
])
export type JevReason = Schema.Schema.Type<typeof JevReasonSchema>

export const JevUsageSchema = Schema.Struct({
  input: Schema.Finite,
  output: Schema.Finite,
})
export type JevUsage = Schema.Schema.Type<typeof JevUsageSchema>

export interface JevEvaluateArgs {
  readonly model?: string
  readonly state: string
  readonly questions: JevQuestions
  readonly signal?: AbortSignal
}

export interface JevEvaluateResult {
  readonly answers: JevAnswers
  readonly usage?: JevUsage
}

export interface JevAdapter {
  readonly evaluate: (args: JevEvaluateArgs) => Promise<JevEvaluateResult>
}

export interface JevSkipResult {
  readonly route: string
  readonly reason: 'skipped' | 'unavailable'
  readonly answers?: JevAnswers
}

export interface JevRouteDecision {
  readonly route: string
  readonly reason?: JevReason
}

export interface ResolvedJevDecision {
  readonly route: string
  readonly reason: JevReason
}

export interface JevRouteArgs {
  readonly answers: JevAnswers
  readonly input: JsonValue
}
