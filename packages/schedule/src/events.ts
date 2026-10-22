import { Schema } from 'effect'

import { defineEventCatalog } from '@looms/core'

import { ScheduleSpecSchema } from './specs'

const GenerationSchema = Schema.Finite
const NextAtSchema = Schema.NullOr(Schema.Finite)

export const SchedulePlannedPayloadSchema = Schema.Struct({
  nextAt: NextAtSchema,
  generation: GenerationSchema,
  spec: ScheduleSpecSchema,
})

export const ScheduleFiredPayloadSchema = Schema.Struct({
  at: Schema.Finite,
  runId: Schema.String,
  nextAt: NextAtSchema,
  generation: GenerationSchema,
  manual: Schema.Boolean,
  triggerId: Schema.optional(Schema.String),
})

export const ScheduleSkippedPayloadSchema = Schema.Struct({
  at: Schema.Finite,
  reason: Schema.String,
  nextAt: NextAtSchema,
  generation: GenerationSchema,
  manual: Schema.Boolean,
  triggerId: Schema.optional(Schema.String),
})

export const ScheduleUpdatedPayloadSchema = Schema.Struct({
  spec: Schema.optional(ScheduleSpecSchema),
  input: Schema.optional(Schema.NullOr(Schema.Json)),
  endAt: Schema.optional(Schema.NullOr(Schema.Finite)),
  maxFires: Schema.optional(Schema.NullOr(Schema.Finite)),
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.optional(Schema.String),
})

export const ScheduleEmptyPayloadSchema = Schema.Struct({})

export const ScheduleRejectedPayloadSchema = Schema.Struct({
  reason: Schema.String,
})

export const scheduleCatalog = defineEventCatalog('schedule', {
  planned: SchedulePlannedPayloadSchema,
  fired: ScheduleFiredPayloadSchema,
  skipped: ScheduleSkippedPayloadSchema,
  updated: ScheduleUpdatedPayloadSchema,
  paused: ScheduleEmptyPayloadSchema,
  resumed: ScheduleEmptyPayloadSchema,
  retired: ScheduleEmptyPayloadSchema,
  triggered: ScheduleEmptyPayloadSchema,
  rejected: ScheduleRejectedPayloadSchema,
})
