import { Option, Schema } from 'effect'

import type { JsonValue } from './types'

/**
 * W3C trace context from the caller that started a run. The field names are the W3C header names,
 * so the object is also a carrier for OpenTelemetry `propagation.extract`.
 */
export const TraceContextSchema = Schema.Struct({
  traceparent: Schema.String,
  tracestate: Schema.optional(Schema.String),
})

export type TraceContext = Schema.Schema.Type<typeof TraceContextSchema>

const decodeTraceContext = Schema.decodeUnknownOption(TraceContextSchema)

const TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/
const INVALID_TRACE_ID = '0'.repeat(32)
const INVALID_PARENT_ID = '0'.repeat(16)
const MAX_TRACESTATE_LENGTH = 512

/**
 * A version-00 `traceparent`, with its `tracestate` when that is within the W3C length limit.
 * Anything else is not a trace context, so callers drop it rather than store it.
 */
export function readTraceContext(
  traceparent: string | null | undefined,
  tracestate?: string | null,
): TraceContext | undefined {
  const match = traceparent ? TRACEPARENT.exec(traceparent.trim()) : null

  if (!match || match[1] === INVALID_TRACE_ID || match[2] === INVALID_PARENT_ID) {
    return undefined
  }

  const parent = match[0]
  const state = tracestate?.trim()

  return state && state.length <= MAX_TRACESTATE_LENGTH
    ? { traceparent: parent, tracestate: state }
    : { traceparent: parent }
}

/** The trace context recorded on `runtime.run.started`, or null when the run has none. */
export function readStoredTrace(value: JsonValue | undefined): TraceContext | null {
  return value === undefined ? null : Option.getOrNull(decodeTraceContext(value))
}

export function readTraceHeaders(headers: Headers): TraceContext | undefined {
  return readTraceContext(headers.get('traceparent'), headers.get('tracestate'))
}

/** The W3C headers for an outgoing request. */
export function traceHeaders(trace: TraceContext | undefined): Record<string, string> {
  if (!trace) {
    return {}
  }

  return trace.tracestate
    ? { traceparent: trace.traceparent, tracestate: trace.tracestate }
    : { traceparent: trace.traceparent }
}
