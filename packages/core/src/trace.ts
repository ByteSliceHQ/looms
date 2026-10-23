import { Predicate } from 'effect'

const W3C_TRACEPARENT_REGEX = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i

const ALL_ZEROS_32 = '00000000000000000000000000000000'
const ALL_ZEROS_16 = '0000000000000000'

export interface TraceContext {
  readonly traceparent: string
  readonly tracestate?: string
}

export interface ParsedTraceparent {
  readonly version: string
  readonly traceId: string
  readonly spanId: string
  readonly flags: string
  readonly sampled: boolean
}

export interface CreateTraceparentOptions {
  readonly traceId?: string
  readonly spanId?: string
  readonly sampled?: boolean
}

function randomHex(charCount: number): string {
  // Synchronous entropy for W3C trace IDs without an Effect runtime.
  // oxlint-disable-next-line effecttsgo/crypto-random-uuid
  const entropy = globalThis.crypto.randomUUID().replaceAll('-', '')

  if (entropy.length >= charCount) {
    return entropy.slice(0, charCount)
  }

  // oxlint-disable-next-line effecttsgo/crypto-random-uuid
  return (entropy + globalThis.crypto.randomUUID().replaceAll('-', '')).slice(0, charCount)
}

/** Generates a 16-byte (32-character) random hex trace id. */
export function generateTraceId(): string {
  const id = randomHex(32)
  return id === ALL_ZEROS_32 ? generateTraceId() : id
}

/** Generates an 8-byte (16-character) random hex span id. */
export function generateSpanId(): string {
  const id = randomHex(16)
  return id === ALL_ZEROS_16 ? generateSpanId() : id
}

/** Validates whether `value` is a compliant W3C traceparent header. */
export function isValidTraceparent(value: string | null | undefined): value is string {
  if (!Predicate.isString(value)) {
    return false
  }

  const match = W3C_TRACEPARENT_REGEX.exec(value.trim())

  if (!match) {
    return false
  }

  const version = match[1]
  const traceId = match[2]
  const spanId = match[3]

  if (version !== '00' || traceId === ALL_ZEROS_32 || spanId === ALL_ZEROS_16) {
    return false
  }

  return true
}

/** Parses a W3C traceparent into its component identifiers and sampling flag. */
export function parseTraceparent(value: string | null | undefined): ParsedTraceparent | null {
  if (!Predicate.isString(value)) {
    return null
  }

  const trimmed = value.trim()
  const match = W3C_TRACEPARENT_REGEX.exec(trimmed)

  if (!match) {
    return null
  }

  const version = match[1]
  const traceId = match[2]
  const spanId = match[3]
  const flags = match[4]

  if (!version || !traceId || !spanId || !flags) {
    return null
  }

  if (version !== '00' || traceId === ALL_ZEROS_32 || spanId === ALL_ZEROS_16) {
    return null
  }

  const flagsNum = parseInt(flags, 16)
  const sampled = (flagsNum & 1) === 1

  return {
    version,
    traceId: traceId.toLowerCase(),
    spanId: spanId.toLowerCase(),
    flags: flags.toLowerCase(),
    sampled,
  }
}

/** Creates a W3C traceparent string conforming to version 00. */
export function createTraceparent(options?: CreateTraceparentOptions): string {
  const traceId = options?.traceId ?? generateTraceId()
  const spanId = options?.spanId ?? generateSpanId()
  const flags = options?.sampled === false ? '00' : '01'

  return `00-${traceId}-${spanId}-${flags}`
}

/**
 * Creates a child traceparent preserving the parent trace ID and sampling flag,
 * but assigning a fresh span ID for the child hop (run or effect).
 */
export function childTraceparent(parent: string | null | undefined, childSpanId?: string): string {
  const parsed = parseTraceparent(parent)

  if (!parsed) {
    return createTraceparent({ spanId: childSpanId })
  }

  const spanId = childSpanId ?? generateSpanId()

  return `00-${parsed.traceId}-${spanId}-${parsed.flags}`
}
