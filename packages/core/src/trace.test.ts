import { describe, expect, test } from 'bun:test'

import { readTraceContext, readTraceHeaders, traceHeaders } from './trace'

const TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

describe('trace context', () => {
  test('reads a version-00 traceparent and its tracestate', () => {
    expect(readTraceContext(` ${TRACEPARENT} `, 'congo=t61rcWkgMzE')).toEqual({
      traceparent: TRACEPARENT,
      tracestate: 'congo=t61rcWkgMzE',
    })
  })

  test('drops values that are not a W3C traceparent', () => {
    expect(readTraceContext(undefined)).toBeUndefined()
    expect(readTraceContext('not-a-trace')).toBeUndefined()
    expect(readTraceContext(TRACEPARENT.toUpperCase())).toBeUndefined()
    expect(readTraceContext(TRACEPARENT.replace(/^00/, '01'))).toBeUndefined()
    expect(readTraceContext(`00-${'0'.repeat(32)}-00f067aa0ba902b7-01`)).toBeUndefined()

    expect(readTraceContext(`00-4bf92f3577b34da6a3ce929d0e0e4736-${'0'.repeat(16)}-01`)).toBe(
      undefined,
    )
  })

  test('drops a tracestate over the W3C length limit but keeps the traceparent', () => {
    expect(readTraceContext(TRACEPARENT, `a=${'b'.repeat(600)}`)).toEqual({
      traceparent: TRACEPARENT,
    })
  })

  test('round-trips through request headers', () => {
    const trace = { traceparent: TRACEPARENT, tracestate: 'k=v' }

    expect(readTraceHeaders(new Headers(traceHeaders(trace)))).toEqual(trace)
    expect(traceHeaders(undefined)).toEqual({})
  })
})
