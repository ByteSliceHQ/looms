import { defineModule, makeDefinitionStore } from '@looms/core'

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
  const listed = options.definitions ?? []
  const definitions = makeDefinitionStore('schedule', listed)
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS

  return defineModule(scheduleModule, () => ({
    definitions: listed,
    threads: { schedule: createScheduleThread(definitions, minIntervalMs) },
    effects: { plan: planEffect, fire: fireEffect },
    projections: { scheduleStatus },
    services: () => ScheduleDefinitionsLive(definitions),
    bindHost(host) {
      definitions.useResolver(host.definitionResolver)
    },
  }))
}
