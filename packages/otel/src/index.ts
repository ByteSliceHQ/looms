import type { Attributes, Meter, MeterProvider } from '@opentelemetry/api'
import { Predicate } from 'effect'

import type { ProjectorObservation, ProjectorObserver } from '@looms/projectors'
import type { RuntimeObservation, RuntimeObserver } from '@looms/runtime'

export interface OpenTelemetryObserverOptions {
  readonly meter?: Meter
  readonly meterProvider?: MeterProvider
  readonly meterName?: string
  readonly attributes?: Attributes
}

export interface OpenTelemetryObservers {
  readonly runtimeObserver: RuntimeObserver
  readonly projectorObserver: ProjectorObserver
}

export function createOpenTelemetryObservers(
  options: OpenTelemetryObserverOptions,
): OpenTelemetryObservers {
  const meter = options.meter ?? options.meterProvider?.getMeter(options.meterName ?? '@looms/otel')

  if (!meter) {
    throw new Error('An OpenTelemetry meter or meterProvider is required')
  }

  const operations = meter.createCounter('looms.operations')
  const errors = meter.createCounter('looms.errors')
  const latency = meter.createHistogram('looms.operation.duration', { unit: 'ms' })
  const timerLateness = meter.createHistogram('looms.timer.lateness', { unit: 'ms' })
  const projectorLag = meter.createHistogram('looms.projector.lag', { unit: '{event}' })
  // Run ids are unbounded, so they never become metric attributes.
  const base = options.attributes ?? {}

  const runtimeObserver: RuntimeObserver = {
    observe(event: RuntimeObservation) {
      const attributes = { ...base, 'looms.operation': event.type }
      operations.add(1, attributes)

      if ('latencyMs' in event) {
        latency.record(event.latencyMs, attributes)
      }

      if (event.type === 'timer.late') {
        timerLateness.record(event.latenessMs, attributes)
      }

      if ('outcome' in event && event.outcome === 'error') {
        errors.add(1, attributes)
      }
    },
  }

  const projectorObserver: ProjectorObserver = {
    observe(event: ProjectorObservation) {
      const attributes = {
        ...base,
        'looms.operation': event.type,
        'looms.projector': event.projector,
      }

      operations.add(1, attributes)
      projectorLag.record(event.lag, attributes)

      if (event.type === 'projector.retry' || event.type === 'projector.dead-letter') {
        errors.add(1, attributes)
      }
    },
  }

  return { runtimeObserver, projectorObserver }
}

export {
  childTraceparent,
  createTraceparent,
  generateSpanId,
  generateTraceId,
  isValidTraceparent,
  parseTraceparent,
  type CreateTraceparentOptions,
  type ParsedTraceparent,
  type TraceContext,
} from '@looms/core'

export interface TraceCarrier {
  traceparent?: string
  tracestate?: string
}

/** Injects active or provided W3C trace context into a plain carrier object. */
export function injectTraceCarrier(traceparent?: string, tracestate?: string): TraceCarrier {
  const carrier: TraceCarrier = {}

  if (traceparent) {
    carrier.traceparent = traceparent
  }

  if (tracestate) {
    carrier.tracestate = tracestate
  }

  return carrier
}

export type TraceCarrierInput =
  | Headers
  | Request
  | TraceCarrier
  | { readonly [key: string]: string | undefined }
  | null
  | undefined

/** Extracts traceparent and tracestate from a carrier, headers object, or request. */
export function extractTraceCarrier(carrier: TraceCarrierInput): TraceCarrier | null {
  if (!carrier) {
    return null
  }

  if (carrier instanceof Headers) {
    const traceparent = carrier.get('traceparent')
    const tracestate = carrier.get('tracestate')

    if (!traceparent) {
      return null
    }

    return {
      traceparent,
      tracestate: tracestate ?? undefined,
    }
  }

  if (carrier instanceof Request) {
    const traceparent = carrier.headers.get('traceparent')
    const tracestate = carrier.headers.get('tracestate')

    if (!traceparent) {
      return null
    }

    return {
      traceparent,
      tracestate: tracestate ?? undefined,
    }
  }

  const traceparent = 'traceparent' in carrier ? carrier.traceparent : undefined
  const tracestate = 'tracestate' in carrier ? carrier.tracestate : undefined

  if (Predicate.isString(traceparent) && traceparent.length > 0) {
    return {
      traceparent,
      tracestate: Predicate.isString(tracestate) ? tracestate : undefined,
    }
  }

  return null
}
