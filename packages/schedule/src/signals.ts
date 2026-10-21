import type { EventInput, JsonValue } from '@looms/core'

import { scheduleModule } from './scope'
import type { ScheduleSpec } from './specs'

export interface ScheduleUpdate {
  readonly spec?: ScheduleSpec
  readonly input?: JsonValue | null
  /** `null` clears the bound. Omit the field to leave it unchanged. */
  readonly endAt?: number | null
  /** `null` clears the bound. Omit the field to leave it unchanged. */
  readonly maxFires?: number | null
}

/** Replace the spec, stored input, or bounds. A no-op when nothing changed. */
export function update(patch: ScheduleUpdate): EventInput {
  return scheduleModule.input('updated', {
    ...(patch.spec === undefined ? undefined : { spec: patch.spec }),
    ...(patch.input === undefined ? undefined : { input: patch.input }),
    ...(patch.endAt === undefined ? undefined : { endAt: patch.endAt }),
    ...(patch.maxFires === undefined ? undefined : { maxFires: patch.maxFires }),
  })
}

/** Drop the armed fire and delete the alarm. A later `resume` rebases from now. */
export function pause(): EventInput {
  return scheduleModule.input('paused', {})
}

/** Arm the next fire after now. Missed fires are not caught up. */
export function resume(): EventInput {
  return scheduleModule.input('resumed', {})
}

/**
 * Park a removed schedule without cancelling it, so the same run id can be resumed.
 * Cancel remains the permanent delete.
 */
export function retire(): EventInput {
  return scheduleModule.input('retired', {})
}

/** Start one target run now, without moving the armed fire. */
export function trigger(): EventInput {
  return scheduleModule.input('triggered', {})
}
