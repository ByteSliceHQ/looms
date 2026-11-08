import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEventCatalog } from './catalog'
import { defineModule } from './module-scope'
import { InvalidInputError } from './schema'
import {
  defineSignal,
  findSignal,
  isSignalDefinition,
  runSignalSync,
  stampSignalThread,
} from './signals'

const Charge = Schema.Struct({
  chargeId: Schema.String,
  amount: Schema.Finite,
})

const payments = defineModule(
  {
    namespace: 'payments',
    protocolVersion: '1.0.0',
    events: defineEventCatalog('payments', {
      'charge.authorized': Charge,
    }),
  },
  (m) => ({
    signals: {
      chargeAuthorized: m.signal({
        description: 'The provider confirmed a charge.',
        input: Charge,
        build: (input) => m.input('charge.authorized', input),
      }),
      noop: m.signal({
        description: 'No payload.',
        build: () => m.input('charge.authorized', { chargeId: 'ch_0', amount: 0 }),
      }),
    },
  }),
)

describe('defineSignal', () => {
  test('is callable and branded', () => {
    const signal = defineSignal({
      description: 'hi',
      input: Charge,
      build: (input) => ({ type: 'payments.charge.authorized', payload: input }),
    })

    expect(isSignalDefinition(signal)).toBe(true)
    expect(signal.description).toBe('hi')

    expect(signal({ chargeId: 'ch_1', amount: 40 }).payload).toEqual({
      chargeId: 'ch_1',
      amount: 40,
    })
  })

  test('stamps threadId onto events that omit it', () => {
    const signal = payments.signals.chargeAuthorized
    const event = signal({ chargeId: 'ch_1', amount: 40 }, { threadId: 'thr_1' })

    expect(event.threadId).toBe('thr_1')
  })

  test('preserves an explicit threadId on the built event', () => {
    const signal = defineSignal({
      build: () => ({
        type: 'payments.charge.authorized',
        payload: { chargeId: 'ch_1', amount: 1 },
        threadId: 'thr_kept',
      }),
    })

    expect(signal({ threadId: 'thr_other' }).threadId).toBe('thr_kept')
  })
})

describe('stampSignalThread', () => {
  test('preserves single vs batch shape', () => {
    const single = stampSignalThread({ type: 'x', payload: null }, 'thr_1')

    const batch = stampSignalThread(
      [
        { type: 'x', payload: 1 },
        { type: 'y', payload: 2 },
      ],
      'thr_1',
    )

    expect(Array.isArray(single)).toBe(false)
    expect(single.threadId).toBe('thr_1')
    expect(batch).toHaveLength(2)
    expect(batch[0]?.threadId).toBe('thr_1')
  })
})

describe('findSignal and runSignalSync', () => {
  test('finds a signal by namespace and name', () => {
    expect(findSignal([payments], 'payments', 'chargeAuthorized')).toBe(
      payments.signals.chargeAuthorized,
    )

    expect(findSignal([payments], 'payments', 'missing')).toBeUndefined()
    expect(findSignal([payments], 'other', 'chargeAuthorized')).toBeUndefined()
  })

  test('validates input and returns stamped events', () => {
    const events = runSignalSync(
      payments.signals.chargeAuthorized,
      { chargeId: 'ch_1', amount: 40 },
      'thr_1',
    )

    expect(events).toEqual([
      {
        type: 'payments.charge.authorized',
        payload: { chargeId: 'ch_1', amount: 40 },
        threadId: 'thr_1',
      },
    ])
  })

  test('rejects invalid input', () => {
    expect(() => runSignalSync(payments.signals.chargeAuthorized, { chargeId: 'ch_1' })).toThrow(
      InvalidInputError,
    )
  })

  test('runs a no-input signal', () => {
    const events = runSignalSync(payments.signals.noop, null)
    expect(events[0]?.payload).toEqual({ chargeId: 'ch_0', amount: 0 })
  })
})
