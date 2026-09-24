import { expect, test } from 'bun:test'

import { createOpenTelemetryObservers } from './index'

test('requires an explicitly supplied OpenTelemetry meter', () => {
  expect(() => createOpenTelemetryObservers({})).toThrow(
    'An OpenTelemetry meter or meterProvider is required',
  )
})
