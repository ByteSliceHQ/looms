import { Schema } from 'effect'

import {
  DEFAULT_DEFINITION_VERSION,
  createKind,
  type DefinitionRef,
  type JsonValue,
} from '@looms/core'

import { ScheduleSpecSchema, type ScheduleSpec } from './specs'

const scheduleKind = createKind('schedule')

export const ScheduleMisfireSchema = Schema.Union([
  Schema.Literal('fire-once'),
  Schema.Literal('skip'),
])
export type ScheduleMisfire = Schema.Schema.Type<typeof ScheduleMisfireSchema>

export const ScheduleOverlapSchema = Schema.Union([Schema.Literal('allow'), Schema.Literal('skip')])
export type ScheduleOverlap = Schema.Schema.Type<typeof ScheduleOverlapSchema>

export const ScheduleStartSchema = Schema.Union([
  Schema.Struct({
    spec: Schema.optional(ScheduleSpecSchema),
    input: Schema.optional(Schema.NullOr(Schema.Json)),
    startAt: Schema.optional(Schema.NullOr(Schema.Finite)),
    endAt: Schema.optional(Schema.NullOr(Schema.Finite)),
    maxFires: Schema.optional(Schema.NullOr(Schema.Finite)),
  }),
  Schema.Null,
])
export type ScheduleStart = Schema.Schema.Type<typeof ScheduleStartSchema>

/** What a fire effect knows when it builds the target input or asks `beforeFire`. */
export interface FireContext {
  readonly at: number
  readonly input: JsonValue | null
  readonly runId: string
  readonly manual: boolean
}

export type BeforeFireResult = 'fire' | { readonly skip: string }

export interface ScheduleDefinition<TName extends string = string> extends DefinitionRef {
  readonly kind: 'schedule'
  readonly name: TName
  readonly version: string
  readonly description?: string
  readonly input?: typeof ScheduleStartSchema
  readonly target: DefinitionRef
  readonly spec: ScheduleSpec
  readonly misfire: ScheduleMisfire
  readonly overlap: ScheduleOverlap
  readonly fireInput?: (ctx: FireContext) => JsonValue | Promise<JsonValue>
  readonly beforeFire?: (ctx: FireContext) => BeforeFireResult | Promise<BeforeFireResult>
}

export type AnyScheduleDefinition = ScheduleDefinition

export function defineSchedule<TName extends string>(
  def: Omit<
    ScheduleDefinition<TName>,
    'kind' | 'version' | 'input' | 'misfire' | 'overlap' | 'fireInput'
  > & {
    readonly version?: string
    readonly misfire?: ScheduleMisfire
    readonly overlap?: ScheduleOverlap
    /** Builds the target run's input at fire time. Defaults to the stored start input. */
    readonly input?: (ctx: FireContext) => JsonValue | Promise<JsonValue>
  },
): ScheduleDefinition<TName> {
  const { input: fireInput, ...rest } = def

  return scheduleKind.define({
    ...rest,
    fireInput,
    version: def.version ?? DEFAULT_DEFINITION_VERSION,
    input: ScheduleStartSchema,
    misfire: def.misfire ?? 'fire-once',
    overlap: def.overlap ?? 'allow',
  })
}
