import { Schema } from 'effect'

import type { JsonValue } from '@looms/core'

import { scheduleModule } from './scope'
import { ScheduleSpecSchema, type ScheduleSpec } from './specs'

export interface ScheduleUpdate {
  readonly spec?: ScheduleSpec
  readonly input?: JsonValue | null
  /** `null` clears the bound. Omit the field to leave it unchanged. */
  readonly endAt?: number | null
  /** `null` clears the bound. Omit the field to leave it unchanged. */
  readonly maxFires?: number | null
  readonly definitionName?: string
  readonly definitionVersion?: string
}

const ScheduleUpdateSchema = Schema.Struct({
  spec: Schema.optional(ScheduleSpecSchema),
  input: Schema.optional(Schema.NullOr(Schema.Json)),
  endAt: Schema.optional(Schema.NullOr(Schema.Finite)),
  maxFires: Schema.optional(Schema.NullOr(Schema.Finite)),
  definitionName: Schema.optional(Schema.String),
  definitionVersion: Schema.optional(Schema.String),
})

/** Replace the spec, stored input, or bounds. A no-op when nothing changed. */
export const update = scheduleModule.signal({
  description: 'Replace the schedule spec, stored input, or bounds.',
  input: ScheduleUpdateSchema,
  build: (patch) =>
    scheduleModule.input('updated', {
      ...(patch.spec === undefined ? undefined : { spec: patch.spec }),
      ...(patch.input === undefined ? undefined : { input: patch.input }),
      ...(patch.endAt === undefined ? undefined : { endAt: patch.endAt }),
      ...(patch.maxFires === undefined ? undefined : { maxFires: patch.maxFires }),
      ...(patch.definitionName === undefined
        ? undefined
        : { definitionName: patch.definitionName }),
      ...(patch.definitionVersion === undefined
        ? undefined
        : { definitionVersion: patch.definitionVersion }),
    }),
})

/** Drop the armed fire and delete the alarm. A later `resume` rebases from now. */
export const pause = scheduleModule.signal({
  description: 'Drop the armed fire and delete the alarm.',
  build: () => scheduleModule.input('paused', {}),
})

/** Arm the next fire after now. Missed fires are not caught up. */
export const resume = scheduleModule.signal({
  description: 'Arm the next fire after now without catching up missed fires.',
  build: () => scheduleModule.input('resumed', {}),
})

/**
 * Park a removed schedule without cancelling it, so the same run id can be resumed.
 * Cancel remains the permanent delete.
 */
export const retire = scheduleModule.signal({
  description: 'Park a removed schedule without cancelling it.',
  build: () => scheduleModule.input('retired', {}),
})

/** Start one target run now, without moving the armed fire. */
export const trigger = scheduleModule.signal({
  description: 'Start one target run now without moving the armed fire.',
  build: () => scheduleModule.input('triggered', {}),
})
