import { Clock, Data, Effect, Schema } from 'effect'

import { DEFAULT_DEFINITION_VERSION, RunLauncherTag, type JsonValue } from '@looms/core'

import {
  ScheduleMisfireSchema,
  ScheduleOverlapSchema,
  type BeforeFireResult,
  type FireContext,
  type ScheduleDefinition,
  type ScheduleMisfire,
  type ScheduleOverlap,
} from './definitions'
import { ScheduleDefinitionsTag } from './definitions-store'
import { scheduleModule } from './scope'
import { MISFIRE_GRACE_MS, ScheduleSpecSchema, nextFireAt, type ScheduleSpec } from './specs'

const NullableFinite = Schema.NullOr(Schema.Finite)
const NullableJson = Schema.NullOr(Schema.Json)

const PlanInputSchema = Schema.Struct({
  spec: ScheduleSpecSchema,
  generation: Schema.Finite,
  fireCount: Schema.Finite,
  startAt: NullableFinite,
  endAt: NullableFinite,
  maxFires: NullableFinite,
  misfire: ScheduleMisfireSchema,
})

const FireInputSchema = Schema.Struct({
  definitionName: Schema.String,
  definitionVersion: Schema.String,
  spec: ScheduleSpecSchema,
  generation: Schema.Finite,
  at: Schema.Finite,
  nextAt: NullableFinite,
  misfire: ScheduleMisfireSchema,
  overlap: ScheduleOverlapSchema,
  storedInput: NullableJson,
  fireCount: Schema.Finite,
  startAt: NullableFinite,
  endAt: NullableFinite,
  maxFires: NullableFinite,
  lastFiredRunId: Schema.NullOr(Schema.String),
  manual: Schema.Boolean,
  triggerId: Schema.optional(Schema.String),
})

type PlanInput = Schema.Schema.Type<typeof PlanInputSchema>
type FireInput = Schema.Schema.Type<typeof FireInputSchema>

const RETRY = { maxAttempts: 5, backoffMs: 1_000, maxBackoffMs: 60_000 } as const

class ScheduleEffectError extends Data.TaggedError('ScheduleEffectError')<{
  readonly message: string
  readonly cause?: unknown
}> {}

export const planEffect = scheduleModule.effect({
  type: 'schedule.plan',
  placement: 'local',
  input: PlanInputSchema,
  retry: RETRY,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      const nextAt = planNextAt(input, now)

      return [
        {
          type: 'schedule.planned',
          payload: { nextAt, generation: input.generation, spec: input.spec },
          threadId: ctx.threadId,
        },
      ]
    }),
})

export const fireEffect = scheduleModule.effect({
  type: 'schedule.fire',
  placement: 'local',
  input: FireInputSchema,
  retry: RETRY,
  execute: (input, ctx) =>
    Effect.gen(function* () {
      const definitions = yield* ScheduleDefinitionsTag
      const launcher = yield* RunLauncherTag
      const now = yield* Clock.currentTimeMillis

      const definition = yield* definitions.resolve(input.definitionName, input.definitionVersion)

      if (!definition) {
        return yield* new ScheduleEffectError({
          message: `Unknown schedule definition "${input.definitionName}@${input.definitionVersion}"`,
        })
      }

      if (!input.manual && input.misfire === 'skip' && now > input.at + MISFIRE_GRACE_MS) {
        return skipped(ctx.threadId, input, input.at, 'misfire', scheduledNext(input, now, now))
      }

      const fireCtx: FireContext = {
        at: input.manual ? now : input.at,
        input: input.storedInput,
        runId: ctx.runId,
        manual: input.manual,
      }

      const gate = yield* resolveBeforeFire(definition, fireCtx)

      if (gate !== 'fire') {
        return skipped(
          ctx.threadId,
          input,
          fireCtx.at,
          gate.skip,
          input.manual ? input.nextAt : scheduledNext(input, input.at, now),
        )
      }

      if (input.overlap === 'skip' && input.lastFiredRunId) {
        const previous = yield* launcher.status(input.lastFiredRunId)

        if (
          previous &&
          previous.status !== 'completed' &&
          previous.status !== 'failed' &&
          previous.status !== 'cancelled'
        ) {
          return skipped(
            ctx.threadId,
            input,
            fireCtx.at,
            'overlap',
            input.manual ? input.nextAt : scheduledNext(input, input.at, now),
          )
        }
      }

      const produced = yield* resolveFireInput(definition, fireCtx)

      const targetRunId =
        input.manual && input.triggerId
          ? `${ctx.runId}:manual:${input.triggerId}`
          : `${ctx.runId}:fire:${input.at}`

      yield* launcher.launch({
        runId: targetRunId,
        kind: definition.target.kind,
        definitionName: definition.target.name,
        definitionVersion: definition.target.version ?? DEFAULT_DEFINITION_VERSION,
        input: produced,
        idempotencyKey: targetRunId,
      })

      const nextFireCount = input.fireCount + 1

      const nextAt = input.manual
        ? input.maxFires !== null && nextFireCount >= input.maxFires
          ? null
          : input.nextAt
        : scheduledNext(input, input.at, now, nextFireCount)

      const payload = {
        at: fireCtx.at,
        runId: targetRunId,
        nextAt,
        generation: input.generation,
        manual: input.manual,
      }

      return [
        {
          type: 'schedule.fired',
          payload:
            input.triggerId === undefined ? payload : { ...payload, triggerId: input.triggerId },
          threadId: ctx.threadId,
        },
      ]
    }),
})

export function planInputOf(state: {
  readonly spec: ScheduleSpec
  readonly generation: number
  readonly fireCount: number
  readonly startAt: number | null
  readonly endAt: number | null
  readonly maxFires: number | null
  readonly misfire: ScheduleMisfire
}): PlanInput {
  return {
    spec: state.spec,
    generation: state.generation,
    fireCount: state.fireCount,
    startAt: state.startAt,
    endAt: state.endAt,
    maxFires: state.maxFires,
    misfire: state.misfire,
  }
}

export function fireInputOf(
  state: {
    readonly definitionName: string
    readonly definitionVersion: string
    readonly spec: ScheduleSpec
    readonly generation: number
    readonly nextAt: number | null
    readonly misfire: ScheduleMisfire
    readonly overlap: ScheduleOverlap
    readonly input: JsonValue | null
    readonly fireCount: number
    readonly startAt: number | null
    readonly endAt: number | null
    readonly maxFires: number | null
    readonly lastFiredRunId: string | null
  },
  at: number,
  manual: boolean,
  triggerId?: string,
): FireInput {
  const input = {
    definitionName: state.definitionName,
    definitionVersion: state.definitionVersion,
    spec: state.spec,
    generation: state.generation,
    at,
    nextAt: state.nextAt,
    misfire: state.misfire,
    overlap: state.overlap,
    storedInput: state.input,
    fireCount: state.fireCount,
    startAt: state.startAt,
    endAt: state.endAt,
    maxFires: state.maxFires,
    lastFiredRunId: state.lastFiredRunId,
    manual,
  }

  if (triggerId === undefined) {
    return input
  }

  return { ...input, triggerId }
}

function planNextAt(input: PlanInput, now: number): number | null {
  if (input.maxFires !== null && input.fireCount >= input.maxFires) {
    return null
  }

  const spec = input.spec
  let next: number | null

  if (spec.type === 'once') {
    if (input.startAt !== null && spec.at < input.startAt) {
      next = null
    } else if (spec.at > now || input.misfire === 'fire-once') {
      next = spec.at
    } else {
      next = null
    }
  } else {
    const notBefore = input.startAt !== null ? Math.max(now, input.startAt) : now

    next = nextFireAt(spec, notBefore - 1)

    if (next !== null && next < notBefore) {
      next = nextFireAt(spec, notBefore)
    }
  }

  return withinEndAt(next, input.endAt)
}

function scheduledNext(
  input: FireInput,
  after: number,
  now: number,
  firesAfter = input.fireCount,
): number | null {
  if (input.maxFires !== null && firesAfter >= input.maxFires) {
    return null
  }

  const floor = input.startAt !== null ? Math.max(now, input.startAt) : now
  let next = nextFireAt(input.spec, after)

  if (next !== null && next <= floor) {
    next = nextFireAt(input.spec, floor)
  }

  return withinEndAt(next, input.endAt)
}

function withinEndAt(next: number | null, endAt: number | null): number | null {
  if (next !== null && endAt !== null && next > endAt) {
    return null
  }

  return next
}

function skipped(
  threadId: string,
  input: FireInput,
  at: number,
  reason: string,
  nextAt: number | null,
) {
  const payload = {
    at,
    reason,
    nextAt,
    generation: input.generation,
    manual: input.manual,
    triggerId: input.triggerId,
  }

  return [
    {
      type: 'schedule.skipped' as const,
      payload,
      threadId,
    },
  ]
}

function resolveBeforeFire(
  definition: ScheduleDefinition,
  ctx: FireContext,
): Effect.Effect<BeforeFireResult, ScheduleEffectError> {
  const decide = definition.beforeFire

  if (!decide) {
    return Effect.succeed('fire')
  }

  return Effect.tryPromise({
    try: () => Promise.resolve(decide(ctx)),
    catch: (cause) =>
      new ScheduleEffectError({
        message: cause instanceof Error ? cause.message : 'beforeFire failed',
        cause,
      }),
  })
}

function resolveFireInput(
  definition: ScheduleDefinition,
  ctx: FireContext,
): Effect.Effect<JsonValue | null, ScheduleEffectError> {
  const produce = definition.fireInput

  if (!produce) {
    return Effect.succeed(ctx.input)
  }

  return Effect.tryPromise({
    try: () => Promise.resolve(produce(ctx)),
    catch: (cause) =>
      new ScheduleEffectError({
        message: cause instanceof Error ? cause.message : 'schedule input failed',
        cause,
      }),
  })
}
