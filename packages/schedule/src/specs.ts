import { Cron, Result, Schema } from 'effect'

/** Default minimum gap between fires. Cron's own minute is the floor. */
export const DEFAULT_MIN_INTERVAL_MS = 60_000

/** A late alarm within this window still counts as on time. */
export const MISFIRE_GRACE_MS = 1_000

const GAP_SAMPLE_STARTS = [
  1_768_435_200_000, 1_774_656_000_000, 1_772_841_600_000, 1_792_800_000_000, 1_793_491_200_000,
] as const

const GAP_SAMPLE_COUNT = 32

const DURATION_UNITS = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const

export const CronSpecSchema = Schema.Struct({
  type: Schema.Literal('cron'),
  expr: Schema.String,
  tz: Schema.optional(Schema.String),
})

export const EverySpecSchema = Schema.Struct({
  type: Schema.Literal('every'),
  everyMs: Schema.Finite,
  anchor: Schema.optional(Schema.Finite),
})

export const OnceSpecSchema = Schema.Struct({
  type: Schema.Literal('once'),
  at: Schema.Finite,
})

export const ScheduleSpecSchema = Schema.Union([CronSpecSchema, EverySpecSchema, OnceSpecSchema])
export type ScheduleSpec = Schema.Schema.Type<typeof ScheduleSpecSchema>
export type CronSpec = Schema.Schema.Type<typeof CronSpecSchema>
export type EverySpec = Schema.Schema.Type<typeof EverySpecSchema>
export type OnceSpec = Schema.Schema.Type<typeof OnceSpecSchema>

export interface EveryOptions {
  /** Epoch millisecond the interval is aligned to. Defaults to the unix epoch. */
  readonly anchor?: number
}

/** A cron expression. `tz` is an IANA name; omitted expressions are evaluated in UTC. */
export function cron(expr: string, options?: { readonly tz?: string }): CronSpec {
  const tz = options?.tz
  return tz === undefined ? { type: 'cron', expr } : { type: 'cron', expr, tz }
}

/** A fixed interval. `duration` is milliseconds, or a string such as `15m`, `1h`, or `30s`. */
export function every(duration: string | number, options?: EveryOptions): EverySpec {
  const everyMs = isMilliseconds(duration) ? duration : parseDuration(duration)

  if (!Number.isFinite(everyMs) || everyMs <= 0) {
    throw new Error('every() duration must be a positive number of milliseconds')
  }

  const anchor = options?.anchor

  if (anchor !== undefined && !Number.isFinite(anchor)) {
    throw new Error('every() anchor must be a finite epoch timestamp')
  }

  return anchor === undefined ? { type: 'every', everyMs } : { type: 'every', everyMs, anchor }
}

/** One fire at an absolute epoch millisecond. */
export function once(at: number): OnceSpec {
  if (!Number.isFinite(at)) {
    throw new Error('once() at must be a finite epoch timestamp')
  }

  return { type: 'once', at }
}

/**
 * The first fire strictly after `after`. Invalid specs and an exhausted `once` return null.
 * This is pure: it does not read the clock.
 */
export function nextFireAt(spec: ScheduleSpec, after: number): number | null {
  switch (spec.type) {
    case 'cron':
      return nextCronAt(spec, after)
    case 'every':
      return nextEveryAt(spec, after)
    case 'once':
      return spec.at > after ? spec.at : null

    default: {
      const unexpected: never = spec
      return unexpected
    }
  }
}

/** A short label for the debugger and logs. */
export function describeSpec(spec: ScheduleSpec): string {
  switch (spec.type) {
    case 'cron':
      return spec.tz === undefined ? spec.expr : `${spec.expr} (${spec.tz})`
    case 'every':
      return `every ${formatDuration(spec.everyMs)}`
    case 'once':
      return `once at ${spec.at}`

    default: {
      const unexpected: never = spec
      return unexpected
    }
  }
}

/**
 * Why `spec` cannot be armed, or undefined when it is allowed.
 * `once` has no gap. A gap equal to `minIntervalMs` is allowed.
 */
export function specRejection(spec: ScheduleSpec, minIntervalMs: number): string | undefined {
  switch (spec.type) {
    case 'cron': {
      const parsed = parseCron(spec)

      if (Result.isFailure(parsed)) {
        return `invalid cron expression "${spec.expr}"`
      }

      return gapRejection(smallestCronGap(parsed.success), minIntervalMs, spec.expr)
    }

    case 'every': {
      if (!Number.isFinite(spec.everyMs) || spec.everyMs <= 0) {
        return 'every() duration must be a positive number of milliseconds'
      }

      if (spec.anchor !== undefined && !Number.isFinite(spec.anchor)) {
        return 'every() anchor must be a finite epoch timestamp'
      }

      return gapRejection(spec.everyMs, minIntervalMs, describeSpec(spec))
    }

    case 'once':
      return Number.isFinite(spec.at) ? undefined : 'once() at must be a finite epoch timestamp'

    default: {
      const unexpected: never = spec
      return unexpected
    }
  }
}

function gapRejection(gapMs: number, minIntervalMs: number, label: string): string | undefined {
  if (minIntervalMs <= 0 || gapMs >= minIntervalMs) {
    return undefined
  }

  return `schedule "${label}" repeats every ${gapMs}ms, below the minimum ${minIntervalMs}ms`
}

function parseCron(spec: CronSpec): Result.Result<Cron.Cron, Cron.CronParseError> {
  return Cron.parse(spec.expr, spec.tz ?? 'UTC')
}

function nextCronAt(spec: CronSpec, after: number): number | null {
  const parsed = parseCron(spec)

  if (Result.isFailure(parsed)) {
    return null
  }

  try {
    return Cron.next(parsed.success, after).getTime()
  } catch {
    return null
  }
}

function nextEveryAt(spec: EverySpec, after: number): number | null {
  if (!Number.isFinite(spec.everyMs) || spec.everyMs <= 0) {
    return null
  }

  const anchor = spec.anchor ?? 0

  if (after < anchor) {
    return anchor
  }

  const steps = Math.floor((after - anchor) / spec.everyMs) + 1
  return anchor + steps * spec.everyMs
}

function smallestCronGap(parsed: Cron.Cron): number {
  let smallest = Number.POSITIVE_INFINITY

  for (const start of GAP_SAMPLE_STARTS) {
    let cursor: number = start
    let previous: number | undefined

    for (let index = 0; index < GAP_SAMPLE_COUNT; index += 1) {
      let next: number

      try {
        next = Cron.next(parsed, cursor).getTime()
      } catch {
        return 0
      }

      if (previous !== undefined) {
        smallest = Math.min(smallest, next - previous)
      }

      previous = next
      cursor = next
    }
  }

  return smallest
}

function parseDuration(duration: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/.exec(duration.trim())
  const amount = match?.[1]
  const unit = match?.[2]

  if (amount === undefined || unit === undefined) {
    throw new Error(
      `every() duration "${duration}" must be a number of milliseconds or a string like "15m"`,
    )
  }

  const multiplier = durationUnitMs(unit)

  if (multiplier === undefined) {
    throw new Error(
      `every() duration "${duration}" must be a number of milliseconds or a string like "15m"`,
    )
  }

  return Number(amount) * multiplier
}

function isMilliseconds(duration: string | number): duration is number {
  return Number.isFinite(duration)
}

function durationUnitMs(unit: string): number | undefined {
  switch (unit) {
    case 'ms':
    case 's':
    case 'm':
    case 'h':
    case 'd':
      return DURATION_UNITS[unit]
    default:
      return undefined
  }
}

function formatDuration(ms: number): string {
  if (ms % 86_400_000 === 0) {
    return `${ms / 86_400_000}d`
  }

  if (ms % 3_600_000 === 0) {
    return `${ms / 3_600_000}h`
  }

  if (ms % 60_000 === 0) {
    return `${ms / 60_000}m`
  }

  if (ms % 1_000 === 0) {
    return `${ms / 1_000}s`
  }

  return `${ms}ms`
}
