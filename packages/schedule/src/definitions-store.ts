import { Context, Layer } from 'effect'

import { makeDefinitionStore, type DefinitionStore } from '@looms/core'

import type { ScheduleDefinition } from './definitions'

export type ScheduleDefinitionStore = DefinitionStore<ScheduleDefinition>

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
  Layer.succeed(ScheduleDefinitionsTag, makeScheduleDefinitionStore(definitions))
