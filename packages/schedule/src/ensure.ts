import { Option, Schema } from 'effect'

import {
  stringifyJson,
  type EventInput,
  type JsonValue,
  type LaunchRunArgs,
  type RunState,
} from '@looms/core'

import type { ScheduleDefinition } from './definitions'
import { resume, update } from './signals'
import { ScheduleSpecSchema, type ScheduleSpec } from './specs'

const ScheduleSnapshotSchema = Schema.Struct({
  spec: Schema.NullOr(ScheduleSpecSchema),
  input: Schema.NullOr(Schema.Json),
  endAt: Schema.NullOr(Schema.Finite),
  maxFires: Schema.NullOr(Schema.Finite),
  paused: Schema.Boolean,
  retired: Schema.Boolean,
  generation: Schema.Finite,
})

export type ScheduleSnapshot = Schema.Schema.Type<typeof ScheduleSnapshotSchema>

const decodeSnapshot = Schema.decodeUnknownOption(ScheduleSnapshotSchema)

/**
 * The three operations a deploy reconciler needs. `createLooms` already has them.
 * On Cloudflare, use `durableObjectScheduleHost`.
 */
export interface ScheduleHost {
  startRun(args: LaunchRunArgs): Promise<{ readonly runId: string }>
  signal(runId: string, events: ReadonlyArray<EventInput>): Promise<RunState>
  getRun(runId: string): Promise<RunState>
}

export interface ScheduleEnsureConfig {
  readonly spec?: ScheduleSpec
  readonly input?: JsonValue | null
  readonly startAt?: number | null
  readonly endAt?: number | null
  readonly maxFires?: number | null
}

export type ScheduleEnsureResult = 'started' | 'updated' | 'resumed' | 'unchanged'

/**
 * Start a schedule, or bring an existing one in line with `config`.
 * A retired schedule is resumed in place. A cancelled, completed, or failed one throws:
 * those run ids cannot be reused.
 */
export async function ensureSchedule(
  host: ScheduleHost,
  definition: ScheduleDefinition,
  runId: string,
  config: ScheduleEnsureConfig = {},
): Promise<ScheduleEnsureResult> {
  const state = await host.getRun(runId)
  const current = readSchedule(state)

  if (!current) {
    await host.startRun({
      runId,
      kind: definition.kind,
      definitionName: definition.name,
      definitionVersion: definition.version,
      input: startInput(config),
    })

    return 'started'
  }

  if (state.status !== 'running') {
    throw new Error(`Schedule "${runId}" is ${state.status}; cancelled schedules need a new runId`)
  }

  const desired = {
    spec: config.spec ?? definition.spec,
    input: config.input ?? null,
    endAt: config.endAt ?? null,
    maxFires: config.maxFires ?? null,
  }

  const changed =
    stringifyJson(current.spec) !== stringifyJson(desired.spec) ||
    stringifyJson(current.input) !== stringifyJson(desired.input) ||
    current.endAt !== desired.endAt ||
    current.maxFires !== desired.maxFires

  const events: EventInput[] = []

  if (changed) {
    events.push(
      update({
        spec: desired.spec,
        input: desired.input,
        endAt: desired.endAt,
        maxFires: desired.maxFires,
      }),
    )
  }

  if (current.paused || current.retired) {
    events.push(resume())
  }

  if (events.length === 0) {
    return 'unchanged'
  }

  await host.signal(runId, events)

  return changed ? 'updated' : 'resumed'
}

/** The schedule thread's config, or null when the run has not started. */
export function readSchedule(state: RunState): ScheduleSnapshot | null {
  const threadId = state.rootThreadId

  if (!threadId) {
    return null
  }

  const thread = state.threads[threadId]

  if (!thread) {
    return null
  }

  const decoded = decodeSnapshot(thread.state)

  if (Option.isNone(decoded)) {
    throw new Error(`Schedule "${state.runId}" state is unreadable`)
  }

  return decoded.value
}

function startInput(config: ScheduleEnsureConfig): JsonValue {
  const input: Record<string, JsonValue> = {}

  if (config.spec !== undefined) {
    input.spec = config.spec
  }

  if (config.input !== undefined) {
    input.input = config.input
  }

  if (config.startAt !== undefined) {
    input.startAt = config.startAt
  }

  if (config.endAt !== undefined) {
    input.endAt = config.endAt
  }

  if (config.maxFires !== undefined) {
    input.maxFires = config.maxFires
  }

  return input
}
