import { Context, Layer } from 'effect'

import { RunLauncherTag, makeDefinitionStore, unavailableRunLauncher } from '@looms/core'

import type { ScheduleDefinition } from './definitions'

export type ScheduleDefinitionStore = ReturnType<typeof makeDefinitionStore<ScheduleDefinition>>

export class ScheduleDefinitionsTag extends Context.Service<
  ScheduleDefinitionsTag,
  ScheduleDefinitionStore
>()('looms/ScheduleDefinitions') {}

export function makeScheduleDefinitionStore(
  definitions: ReadonlyArray<ScheduleDefinition>,
): ScheduleDefinitionStore {
  return makeDefinitionStore('schedule', definitions)
}

export const ScheduleDefinitionsLive = (definitions: ReadonlyArray<ScheduleDefinition>) =>
  Layer.mergeAll(
    Layer.succeed(ScheduleDefinitionsTag, makeScheduleDefinitionStore(definitions)),
    Layer.succeed(RunLauncherTag, unavailableRunLauncher),
  )
