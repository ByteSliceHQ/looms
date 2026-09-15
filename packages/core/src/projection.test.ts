import { describe, expect, test } from 'bun:test'

import type { StandardSchemaV1 } from '@standard-schema/spec'
import { Effect, Schema, Stream } from 'effect'

import { createEvent } from './envelope'
import { defineProjection, foldProjection, project, projectStream } from './projection'
import type { JsonValue } from './types'

function assignSeq<T extends { seq: number }>(events: T[]): T[] {
  return events.map((e, idx) => ({ ...e, seq: idx + 1 }))
}

// Standard schema stub matching StandardSchemaV1
function mockStandardSchema<T>(_sample: T): StandardSchemaV1<JsonValue, T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate(raw: JsonValue) {
        // SAFETY: stub cast for testing purposes.
        return { value: raw as T }
      },
    },
  }
}

interface OrderState {
  orderId: string | null
  items: string[]
  total: number
  status: 'draft' | 'awaiting_approval' | 'processing' | 'completed' | 'failed'
  approvalId: string | null
  paymentId: string | null
  history: { step: string; timestamp: number }[]
}

const orderSchema = mockStandardSchema<OrderState>({
  orderId: null,
  items: [],
  total: 0,
  status: 'draft',
  approvalId: null,
  paymentId: null,
  history: [],
})

describe('defineProjection', () => {
  test('infers state type from shape without explicit generic', () => {
    const orderTracker = defineProjection({
      name: 'orderTracker',
      shape: orderSchema,
      initialState: {
        orderId: null,
        items: [],
        total: 0,
        status: 'draft',
        approvalId: null,
        paymentId: null,
        history: [],
      },
      reduce(state, event) {
        switch (event.type) {
          case 'order.created': {
            // SAFETY: payload matches the order.created event structure.
            const payload = event.payload as { orderId: string; items: string[]; total: number }
            return {
              ...state,
              orderId: payload.orderId,
              items: payload.items,
              total: payload.total,
              history: [...state.history, { step: 'Order Created', timestamp: event.ts }],
            }
          }

          default:
            return state
        }
      },
    })

    expect(orderTracker.name).toBe('orderTracker')
    expect(orderTracker.shape).toBe(orderSchema)

    const runId = 'run_1'

    const events = assignSeq([
      createEvent(runId, {
        type: 'order.created',
        payload: { orderId: 'ord_123', items: ['widget'], total: 42 },
      }),
    ])

    const result = project(orderTracker, events)
    expect(result.orderId).toBe('ord_123')
    expect(result.items).toEqual(['widget'])
    expect(result.total).toBe(42)
    expect(result.status).toBe('draft')
    expect(result.history).toHaveLength(1)
  })

  test('supports Effect Schema as shape', () => {
    const CounterEffectSchema = Schema.Struct({
      count: Schema.Number,
      label: Schema.String,
    })

    const counter = defineProjection({
      name: 'counter',
      shape: CounterEffectSchema,
      initialState: { count: 0, label: 'initial' },
      reduce(state, event) {
        if (event.type === 'counter.increment') {
          return { ...state, count: state.count + 1 }
        }

        return state
      },
    })

    expect(counter.shape).toBe(CounterEffectSchema)

    const events = assignSeq([
      createEvent('run_eff', { type: 'counter.increment', payload: {} }),
      createEvent('run_eff', { type: 'counter.increment', payload: {} }),
    ])

    const result = foldProjection(counter, events)
    expect(result.count).toBe(2)
    expect(result.label).toBe('initial')
  })

  test('preserves backward compatibility with explicit generic and no shape', () => {
    interface CustomState {
      count: number
      tags: string[]
    }

    const custom = defineProjection<CustomState>({
      name: 'custom',
      initialState: { count: 0, tags: [] },
      reduce(state, event) {
        if (event.type === 'tag.added') {
          // SAFETY: payload is string in test event.
          return { ...state, tags: [...state.tags, event.payload as string] }
        }

        return state
      },
    })

    expect(custom.shape).toBeUndefined()
    const result = project(custom, [createEvent('run_c', { type: 'tag.added', payload: 'first' })])
    expect(result.tags).toEqual(['first'])
  })

  test('infers state from initialState when shape and generic are omitted', () => {
    const simple = defineProjection({
      name: 'simple',
      initialState: { count: 0 },
      reduce(state, event) {
        if (event.type === 'inc') {
          return { count: state.count + 1 }
        }

        return state
      },
    })

    const result = project(simple, [createEvent('run_s', { type: 'inc', payload: {} })])
    expect(result.count).toBe(1)
  })

  test('projectStream reduces events over an Effect Stream', async () => {
    const simple = defineProjection({
      name: 'stream_simple',
      initialState: { count: 0 },
      reduce(state, event) {
        if (event.type === 'inc') {
          return { count: state.count + 1 }
        }

        return state
      },
    })

    const stream = Stream.fromIterable([
      createEvent('run_s', { type: 'inc', payload: {} }),
      createEvent('run_s', { type: 'inc', payload: {} }),
      createEvent('run_s', { type: 'inc', payload: {}, ephemeral: true }),
    ])

    const result = await Effect.runPromise(projectStream(simple, stream))
    expect(result.count).toBe(2)
  })
})
