import { Schema } from 'effect'

import { defineEventCatalog } from '@looms/core'

export const ApprovalActionSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  outcome: Schema.Union([Schema.Literal('approve'), Schema.Literal('reject')]),
})
export type ApprovalAction = Schema.Schema.Type<typeof ApprovalActionSchema>

export const ApprovalRequestedPayloadSchema = Schema.Struct({
  approvalId: Schema.String,
  title: Schema.String,
  description: Schema.optional(Schema.String),
  actions: Schema.Array(ApprovalActionSchema),
  schema: Schema.optional(Schema.Json),
})
export type ApprovalRequested = Schema.Schema.Type<typeof ApprovalRequestedPayloadSchema>

export const ApprovalDecidedPayloadSchema = Schema.Struct({
  approvalId: Schema.String,
  actionId: Schema.String,
  outcome: Schema.Union([Schema.Literal('approve'), Schema.Literal('reject')]),
  payload: Schema.optional(Schema.Json),
})
export type ApprovalDecided = Schema.Schema.Type<typeof ApprovalDecidedPayloadSchema>

export const ApprovalTimedOutPayloadSchema = Schema.Struct({
  approvalId: Schema.String,
})
export type ApprovalTimedOut = Schema.Schema.Type<typeof ApprovalTimedOutPayloadSchema>

export const approvalCatalog = defineEventCatalog('approval', {
  requested: ApprovalRequestedPayloadSchema,
  decided: ApprovalDecidedPayloadSchema,
  timed_out: ApprovalTimedOutPayloadSchema,
})
