import { Schema } from 'effect'

import { defineEventCatalog } from '@looms/core'

import {
  EvaluatorAnswersSchema,
  EvaluatorReasonSchema,
  EvaluatorRouteSchema,
  EvaluatorUsageSchema,
} from './types'

export const EvaluatorRequestedPayloadSchema = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  state: Schema.String,
  model: Schema.optional(Schema.String),
})
export type EvaluatorRequested = Schema.Schema.Type<typeof EvaluatorRequestedPayloadSchema>

export const EvaluatorEvaluatedPayloadSchema = Schema.Struct({
  evaluationId: Schema.String,
  definitionName: Schema.optional(Schema.String),
  answers: EvaluatorAnswersSchema,
  route: EvaluatorRouteSchema,
  reason: EvaluatorReasonSchema,
  usage: Schema.optional(EvaluatorUsageSchema),
})
export type EvaluatorEvaluated = Schema.Schema.Type<typeof EvaluatorEvaluatedPayloadSchema>

export const evaluatorCatalog = defineEventCatalog('evaluator', {
  requested: EvaluatorRequestedPayloadSchema,
  evaluated: EvaluatorEvaluatedPayloadSchema,
})
