import { Option, Predicate, Schema } from 'effect'

import {
  complete,
  definitionKey,
  emit,
  fail,
  invoke,
  stringifyJson,
  wait,
  type JsonValue,
  type RuntimeEffect,
  type ThreadDefinition,
} from '@looms/core'

import type { ScheduleDefinition, ScheduleMisfire, ScheduleOverlap } from './definitions'
import { ScheduleStartSchema } from './definitions'
import { fireEffect, fireInputOf, planEffect, planInputOf } from './effects'
import { ScheduleUpdatedPayloadSchema } from './events'
import { scheduleModule } from './scope'
import { specRejection, type ScheduleSpec } from './specs'

const PENDING_TRIGGER_CAP = 32

const CONTROL_TYPES = [
  'schedule.updated',
  'schedule.paused',
  'schedule.resumed',
  'schedule.retired',
  'schedule.triggered',
] as const

type ControlType = (typeof CONTROL_TYPES)[number]

export interface ScheduleState {
  readonly spec: ScheduleSpec | null
  readonly input: JsonValue | null
  readonly endAt: number | null
  readonly maxFires: number | null
  readonly startAt: number | null
  readonly paused: boolean
  readonly retired: boolean
  readonly generation: number
  readonly controlEpoch: number
  readonly nextAt: number | null
  readonly armed: boolean
  readonly fireCount: number
  readonly lastFiredRunId: string | null
  readonly pendingTriggers: readonly string[]
  readonly done: boolean
  readonly invalid: string | null
  readonly rejection: string | null
  readonly misfire: ScheduleMisfire
  readonly overlap: ScheduleOverlap
  readonly definitionName: string
  readonly definitionVersion: string
}

const decodeStart = Schema.decodeUnknownOption(ScheduleStartSchema)
const decodeUpdate = Schema.decodeUnknownOption(ScheduleUpdatedPayloadSchema)

export function createScheduleThread(
  definitions: readonly ScheduleDefinition[],
  minIntervalMs: number,
): ThreadDefinition<ScheduleState> {
  const byKey = new Map(
    definitions.map(
      (definition) =>
        [definitionKey(definition.kind, definition.name, definition.version), definition] as const,
    ),
  )

  return scheduleModule.thread({
    kind: 'schedule',
    input: ScheduleStartSchema,
    forgetsCompletedEffects: true,
    initialState: (ctx) => {
      const definition = byKey.get(
        definitionKey('schedule', ctx.definitionName, ctx.definitionVersion),
      )

      const base = {
        input: null,
        endAt: null,
        maxFires: null,
        startAt: null,
        paused: false,
        retired: false,
        generation: 0,
        controlEpoch: 0,
        nextAt: null,
        armed: false,
        fireCount: 0,
        lastFiredRunId: null,
        pendingTriggers: [],
        done: false,
        rejection: null,
        misfire: definition?.misfire ?? 'fire-once',
        overlap: definition?.overlap ?? 'allow',
        definitionName: ctx.definitionName,
        definitionVersion: ctx.definitionVersion,
      } satisfies Omit<ScheduleState, 'spec' | 'invalid'>

      if (!definition) {
        return {
          ...base,
          spec: null,
          invalid: `Unknown schedule definition "${ctx.definitionName}@${ctx.definitionVersion}"`,
        }
      }

      const start = Option.getOrUndefined(decodeStart(ctx.input))
      const config = start && start !== null ? start : {}
      const spec = config.spec ?? definition.spec
      const invalid = specRejection(spec, minIntervalMs) ?? boundsError(config)

      return {
        ...base,
        spec: invalid ? null : spec,
        input: config.input ?? null,
        endAt: config.endAt ?? null,
        maxFires: config.maxFires ?? null,
        startAt: config.startAt ?? null,
        invalid: invalid ?? null,
      }
    },
    step(state, event) {
      switch (event.type) {
        case 'schedule.planned': {
          if (event.payload.generation !== state.generation) {
            return state
          }

          if (event.payload.nextAt === null) {
            return { ...state, spec: event.payload.spec, nextAt: null, armed: false, done: true }
          }

          return { ...state, spec: event.payload.spec, nextAt: event.payload.nextAt, armed: true }
        }

        case 'schedule.fired': {
          const pending = dropTrigger(state.pendingTriggers, event.payload.triggerId)

          if (event.payload.manual) {
            return {
              ...state,
              fireCount: state.fireCount + 1,
              lastFiredRunId: event.payload.runId,
              pendingTriggers: pending,
            }
          }

          if (event.payload.generation !== state.generation) {
            return state
          }

          const done = event.payload.nextAt === null

          return {
            ...state,
            fireCount: state.fireCount + 1,
            lastFiredRunId: event.payload.runId,
            nextAt: event.payload.nextAt,
            armed: !done,
            done,
            pendingTriggers: pending,
          }
        }

        case 'schedule.skipped': {
          const pending = dropTrigger(state.pendingTriggers, event.payload.triggerId)

          if (event.payload.manual) {
            return { ...state, pendingTriggers: pending }
          }

          if (event.payload.generation !== state.generation) {
            return state
          }

          const done = event.payload.nextAt === null

          return {
            ...state,
            nextAt: event.payload.nextAt,
            armed: !done,
            done,
            pendingTriggers: pending,
          }
        }

        case 'schedule.rejected':
          return { ...state, rejection: null }

        case 'runtime.wait.satisfied':
          return applySatisfied(state, event.payload.tag, event.payload.event, minIntervalMs)

        default:
          return state
      }
    },
    effects(state, ctx): RuntimeEffect[] {
      if (state.invalid && state.fireCount === 0 && !state.armed) {
        return [fail(state.invalid)]
      }

      const spec = state.spec

      if (state.done || !spec) {
        return [complete({ fireCount: state.fireCount })]
      }

      const armed = { ...state, spec }

      const effects: RuntimeEffect[] = []

      if (state.rejection) {
        effects.push(
          emit(
            {
              type: 'schedule.rejected',
              payload: { reason: state.rejection },
              threadId: ctx.threadId,
            },
            `reject:${state.controlEpoch}`,
          ),
        )
      }

      if (!state.retired) {
        for (const triggerId of state.pendingTriggers) {
          effects.push(
            invoke(
              fireEffect,
              fireInputOf(armed, state.nextAt ?? 0, true, triggerId),
              `manual:${String(triggerId)}`,
            ),
          )
        }
      }

      if (!state.paused && !state.retired) {
        if (!state.armed) {
          effects.push(invoke(planEffect, planInputOf(armed), `plan:${state.generation}`))
        } else if (state.nextAt !== null) {
          const nextAt = state.nextAt

          effects.push(
            invoke(
              fireEffect,
              fireInputOf(armed, nextAt, false),
              `fire:${String(state.generation)}:${String(nextAt)}`,
              { at: nextAt },
            ),
          )
        }
      }

      effects.push(
        wait({
          waitId: `control:${state.controlEpoch}`,
          on: { type: [...CONTROL_TYPES] },
          tag: { control: true, epoch: state.controlEpoch },
        }),
      )

      return effects
    },
  })
}

function applySatisfied(
  state: ScheduleState,
  tag: JsonValue | undefined,
  cause: { readonly id: string; readonly type: string; readonly payload: JsonValue },
  minIntervalMs: number,
): ScheduleState {
  if (!Predicate.isObject(tag) || tag.control !== true || !isControlType(cause.type)) {
    return state
  }

  switch (cause.type) {
    case 'schedule.updated':
      return applyUpdate(state, cause.payload, minIntervalMs)
    case 'schedule.paused':
      return {
        ...state,
        paused: true,
        armed: false,
        nextAt: null,
        controlEpoch: state.controlEpoch + 1,
      }
    case 'schedule.resumed':
      if (!state.paused && !state.retired) {
        return { ...state, controlEpoch: state.controlEpoch + 1 }
      }

      return {
        ...state,
        paused: false,
        retired: false,
        armed: false,
        nextAt: null,
        generation: state.generation + 1,
        controlEpoch: state.controlEpoch + 1,
        rejection: null,
      }
    case 'schedule.retired':
      return {
        ...state,
        retired: true,
        paused: true,
        armed: false,
        nextAt: null,
        pendingTriggers: [],
        controlEpoch: state.controlEpoch + 1,
      }

    case 'schedule.triggered': {
      const pending =
        state.pendingTriggers.length < PENDING_TRIGGER_CAP
          ? [...state.pendingTriggers, cause.id]
          : state.pendingTriggers

      return { ...state, pendingTriggers: pending, controlEpoch: state.controlEpoch + 1 }
    }

    default: {
      const unexpected: never = cause.type
      return unexpected
    }
  }
}

function applyUpdate(
  state: ScheduleState,
  payload: JsonValue,
  minIntervalMs: number,
): ScheduleState {
  const decoded = decodeUpdate(payload)

  if (Option.isNone(decoded)) {
    return {
      ...state,
      rejection: 'schedule update payload is invalid',
      controlEpoch: state.controlEpoch + 1,
    }
  }

  const patch = decoded.value

  if (patch.spec) {
    const rejection = specRejection(patch.spec, minIntervalMs)

    if (rejection) {
      return { ...state, rejection, controlEpoch: state.controlEpoch + 1 }
    }
  }

  if (!state.spec && !patch.spec) {
    return { ...state, rejection: 'schedule has no spec', controlEpoch: state.controlEpoch + 1 }
  }

  const spec = patch.spec ?? state.spec

  if (!spec) {
    return { ...state, rejection: 'schedule has no spec', controlEpoch: state.controlEpoch + 1 }
  }

  const input = patch.input === undefined ? state.input : patch.input
  const endAt = patch.endAt === undefined ? state.endAt : patch.endAt
  const maxFires = patch.maxFires === undefined ? state.maxFires : patch.maxFires
  const bounds = boundsError({ endAt, maxFires, startAt: state.startAt })

  if (bounds) {
    return { ...state, rejection: bounds, controlEpoch: state.controlEpoch + 1 }
  }

  if (
    stringifyJson(spec) === stringifyJson(state.spec) &&
    stringifyJson(input) === stringifyJson(state.input) &&
    endAt === state.endAt &&
    maxFires === state.maxFires
  ) {
    return { ...state, controlEpoch: state.controlEpoch + 1 }
  }

  return {
    ...state,
    spec,
    input,
    endAt,
    maxFires,
    generation: state.generation + 1,
    armed: false,
    nextAt: null,
    controlEpoch: state.controlEpoch + 1,
    rejection: null,
  }
}

function boundsError(config: {
  readonly startAt?: number | null
  readonly endAt?: number | null
  readonly maxFires?: number | null
}): string | undefined {
  if (config.maxFires != null && (!Number.isInteger(config.maxFires) || config.maxFires < 1)) {
    return 'maxFires must be an integer of at least 1'
  }

  if (config.startAt != null && !Number.isFinite(config.startAt)) {
    return 'startAt must be a finite epoch timestamp'
  }

  if (config.endAt != null && !Number.isFinite(config.endAt)) {
    return 'endAt must be a finite epoch timestamp'
  }

  return undefined
}

function dropTrigger(pending: readonly string[], triggerId: string | undefined): readonly string[] {
  if (triggerId === undefined) {
    return pending
  }

  return pending.filter((id) => id !== triggerId)
}

function isControlType(type: string): type is ControlType {
  switch (type) {
    case 'schedule.updated':
    case 'schedule.paused':
    case 'schedule.resumed':
    case 'schedule.retired':
    case 'schedule.triggered':
      return true
    default:
      return false
  }
}
