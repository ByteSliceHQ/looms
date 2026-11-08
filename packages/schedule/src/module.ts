import { defineModule, makeDefinitionStore } from '@looms/core'

import type { ScheduleDefinition } from './definitions'
import { ScheduleDefinitionsLive } from './definitions-store'
import { fireEffect, planEffect } from './effects'
import { scheduleStatus } from './projections'
import { scheduleModule } from './scope'
import { pause, resume, retire, trigger, update } from './signals'
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
    signals: { update, pause, resume, retire, trigger },
    examples: [
      {
        name: 'a fire updates status and recent history',
        events: [
          scheduleModule.input('planned', {
            nextAt: 1_000,
            generation: 1,
            spec: { type: 'once', at: 1_000 },
          }),
          scheduleModule.input('fired', {
            at: 1_000,
            runId: 'run_child',
            nextAt: null,
            generation: 1,
            manual: false,
          }),
        ],
        projections: {
          scheduleStatus: {
            spec: { type: 'once', at: 1_000 },
            status: 'running',
            nextAt: null,
            fireCount: 1,
            recent: [{ at: 1_000, runId: 'run_child', outcome: 'fired' }],
          },
        },
      },
    ],
    services: () => ScheduleDefinitionsLive(definitions),
    bindHost(host) {
      definitions.useResolver(host.definitionResolver)
    },
  }))
}
