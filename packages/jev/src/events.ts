import { Schema } from 'effect'

import { defineEventCatalog } from '@looms/core'

import {
  JevAnswersSchema,
  JevQuestionsSchema,
  JevReasonSchema,
  JevRouteSchema,
  JevUsageSchema,
} from './types'

export const JevRequestedPayloadSchema = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  state: Schema.String,
  questions: Schema.optional(JevQuestionsSchema),
  model: Schema.optional(Schema.String),
})
export type JevRequested = Schema.Schema.Type<typeof JevRequestedPayloadSchema>

export const JevEvaluatedPayloadSchema = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  answers: JevAnswersSchema,
  route: JevRouteSchema,
  reason: JevReasonSchema,
  usage: Schema.optional(JevUsageSchema),
})
export type JevEvaluated = Schema.Schema.Type<typeof JevEvaluatedPayloadSchema>

export const jevCatalog = defineEventCatalog('jev', {
  requested: JevRequestedPayloadSchema,
  evaluated: JevEvaluatedPayloadSchema,
})
