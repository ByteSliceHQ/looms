import { expect, test } from 'bun:test'

import {
  childTraceparent,
  createOpenTelemetryObservers,
  createTraceparent,
  extractTraceCarrier,
  injectTraceCarrier,
  isValidTraceparent,
  parseTraceparent,
} from './index'

test('requires an explicitly supplied OpenTelemetry meter', () => {
  expect(() => createOpenTelemetryObservers({})).toThrow(
    'An OpenTelemetry meter or meterProvider is required',
  )
})

test('creates and parses valid W3C traceparents', () => {
  const tp = createTraceparent()
  expect(isValidTraceparent(tp)).toBe(true)

  const parsed = parseTraceparent(tp)
  expect(parsed).not.toBeNull()
  expect(parsed?.version).toBe('00')
  expect(parsed?.traceId).toHaveLength(32)
  expect(parsed?.spanId).toHaveLength(16)
  expect(parsed?.sampled).toBe(true)
})

test('childTraceparent keeps parent traceId and updates spanId', () => {
  const parent = createTraceparent()
  const parentParsed = parseTraceparent(parent)!
  const child = childTraceparent(parent)
  const childParsed = parseTraceparent(child)!

  expect(childParsed.traceId).toBe(parentParsed.traceId)
  expect(childParsed.spanId).not.toBe(parentParsed.spanId)
  expect(childParsed.flags).toBe(parentParsed.flags)
})

test('injectTraceCarrier and extractTraceCarrier round-trip', () => {
  const tp = createTraceparent()
  const ts = 'congo=t61rcWkgMzE'
  const carrier = injectTraceCarrier(tp, ts)

  expect(carrier.traceparent).toBe(tp)
  expect(carrier.tracestate).toBe(ts)

  const extracted = extractTraceCarrier(carrier)
  expect(extracted?.traceparent).toBe(tp)
  expect(extracted?.tracestate).toBe(ts)

  const headers = new Headers({ traceparent: tp, tracestate: ts })
  const fromHeaders = extractTraceCarrier(headers)
  expect(fromHeaders?.traceparent).toBe(tp)
  expect(fromHeaders?.tracestate).toBe(ts)
})
