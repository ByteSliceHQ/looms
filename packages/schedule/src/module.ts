import { defineModule } from '@looms/core'

import type { ScheduleDefinition } from './definitions'
import { ScheduleDefinitionsLive } from './definitions-store'
import { fireEffect, planEffect } from './effects'
import { scheduleStatus } from './projections'
import { scheduleModule } from './scope'
import { DEFAULT_MIN_INTERVAL_MS } from './specs'
import { createScheduleThread } from './threads'

export interface ScheduleModuleOptions {
  readonly definitions?: readonly ScheduleDefinition[]
  /** Reject specs whose shortest gap is below this. Defaults to 60 seconds. `once` is exempt. */
  readonly minIntervalMs?: number
}

export function schedule(options: ScheduleModuleOptions = {}) {
  const definitions = options.definitions ?? []
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS

  return defineModule(scheduleModule, () => ({
    definitions,
    threads: { schedule: createScheduleThread(definitions, minIntervalMs) },
    effects: { plan: planEffect, fire: fireEffect },
    projections: { scheduleStatus },
    services: () => ScheduleDefinitionsLive(definitions),
  }))
}
