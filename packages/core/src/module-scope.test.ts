import { describe, expect, test } from 'bun:test'

import { Context, Effect, Layer, Schema } from 'effect'

import { defineEventCatalog, payload } from './catalog'
import { invoke } from './effects'
import { createModuleScope, defineModule, type EventOf, type ThreadStateOf } from './module-scope'

export interface DatabaseService {
  readonly query: (sql: string) => Promise<string>
}

export class DatabaseTag extends Context.Service<DatabaseTag, DatabaseService>()(
  'test/DatabaseService',
) {}

const ordersCatalog = defineEventCatalog('orders', {
  created: payload<{ orderId: string; amount: number; note?: string }>(),
  shipped: payload<{ orderId: string; trackingNumber: string }>(),
})

const shippingCatalog = defineEventCatalog('shipping', {
  delivered: payload<{ trackingNumber: string; at: number }>(),
})

describe('defineModule scope', () => {
  const ordersModule = createModuleScope({
    namespace: 'orders',
    protocolVersion: '1.0.0',
    events: ordersCatalog,
    observes: [shippingCatalog],
  })

  test('infers state and narrows events in thread step', () => {
    const OrderStateSchema = Schema.Struct({
      orderId: Schema.String,
      status: Schema.String,
      note: Schema.optional(Schema.String),
      deliveredAt: Schema.optional(Schema.Number),
    })

    type OrderThreadState = Schema.Schema.Type<typeof OrderStateSchema>

    const orderThread = ordersModule.thread({
      kind: 'order',
      shape: OrderStateSchema,
      initialState: (): OrderThreadState => ({
        orderId: '',
        status: 'pending',
      }),
      step(state, event) {
        // state should be inferred without explicit annotation
        const inferredState: OrderThreadState = state

        expect(inferredState).toBeDefined()

        switch (event.type) {
          case 'orders.created': {
            // Optional-key payload regression test: note?: string is preserved, not erased to JsonValue
            const note: string | undefined = event.payload.note
            const amount: number = event.payload.amount
            expect(amount).toBe(50)

            return {
              ...state,
              orderId: event.payload.orderId,
              status: 'created',
              note,
            }
          }

          case 'orders.shipped': {
            const tracking: string = event.payload.trackingNumber
            return { ...state, status: `shipped:${tracking}` }
          }

          case 'shipping.delivered': {
            // Observed event from shippingCatalog is typed
            const at: number = event.payload.at
            return { ...state, status: 'delivered', deliveredAt: at }
          }

          case 'runtime.thread.started': {
            // Protocol event is typed
            const threadId: string = event.payload.threadId
            return { ...state, orderId: threadId }
          }

          default:
            return state
        }
      },
      effects(_state) {
        return []
      },
    })

    type InferredThreadState = ThreadStateOf<typeof orderThread>
    const checkState: InferredThreadState = { orderId: '1', status: 'pending' }

    expect(checkState.orderId).toBe('1')

    type ScopeEvent = EventOf<typeof ordersModule>

    const sampleEvent: ScopeEvent = {
      id: 'e1',
      runId: 'r1',
      seq: 1,
      ts: 1000,
      type: 'orders.created',
      payload: { orderId: 'ord-1', amount: 10 },
      threadId: null,
      parentThreadId: null,
      origin: { type: 'system' },
      idempotencyKey: null,
    }

    expect(sampleEvent.type).toBe('orders.created')

    expect(orderThread.kind).toBe('order')

    // Test runtime execution of step
    const initial = orderThread.initialState({
      runId: 'r1',
      threadId: 't1',
      parentThreadId: null,
      definitionName: 'test',
      input: null,
    })

    const step1 = orderThread.step(
      initial,
      {
        id: 'e1',
        runId: 'r1',
        seq: 1,
        ts: 1000,
        type: 'orders.created',
        payload: { orderId: 'ord-123', amount: 50, note: 'gift' },
        threadId: 't1',
        origin: { type: 'system' },
      },
      { runId: 'r1', threadId: 't1', parentThreadId: null },
    )

    expect(step1.orderId).toBe('ord-123')
    expect(step1.status).toBe('created')
    expect(step1.note).toBe('gift')
  })

  test('infers state and narrows events in projection reduce', () => {
    const summary = ordersModule.projection({
      name: 'orderSummary',
      // SAFETY: Explicit null union initialization for projection state.
      initialState: { count: 0, totalAmount: 0, lastTracking: null as string | null },
      reduce(state, event) {
        // state should be inferred from initialState
        switch (event.type) {
          case 'orders.created': {
            return {
              ...state,
              count: state.count + 1,
              totalAmount: state.totalAmount + event.payload.amount,
            }
          }

          case 'orders.shipped': {
            return { ...state, lastTracking: event.payload.trackingNumber }
          }

          default:
            return state
        }
      },
    })

    expect(summary.name).toBe('orderSummary')

    const reduced = summary.reduce(summary.initialState, {
      id: 'e1',
      runId: 'r1',
      seq: 1,
      ts: 1000,
      type: 'orders.created',
      payload: { orderId: '1', amount: 100 },
      threadId: null,
      origin: { type: 'system' },
    })

    expect(reduced.count).toBe(1)
    expect(reduced.totalAmount).toBe(100)
  })

  test('scope.input and scope.emit produce typed event inputs', () => {
    const input = ordersModule.input('created', {
      orderId: 'ord-1',
      amount: 42,
      note: 'hello',
    })

    expect(input.type).toBe('orders.created')
    expect(input.payload.orderId).toBe('ord-1')
    expect(input.payload.amount).toBe(42)

    const emitted = ordersModule.emit('shipped', {
      orderId: 'ord-1',
      trackingNumber: 'track-99',
    })

    expect(emitted.type).toBe('runtime.emit')
    expect(emitted.event.type).toBe('orders.shipped')
    expect(emitted.event.payload.trackingNumber).toBe('track-99')
  })

  test('scope.effect enforces return event types and ctx.emit', () => {
    const createEffect = ordersModule.effect({
      type: 'orders.create',
      input: Schema.Struct({ orderId: Schema.String, amount: Schema.Number }),
      execute: async (input, ctx) => {
        await ctx.emit({
          type: 'orders.created',
          payload: { orderId: input.orderId, amount: input.amount },
        })

        return [
          {
            type: 'orders.shipped',
            payload: { orderId: input.orderId, trackingNumber: 'TRK-1' },
          },
        ]
      },
    })

    expect(createEffect.type).toBe('orders.create')
  })

  test('typed invoke accepts effect definition and verifies input', () => {
    const createEffect = ordersModule.effect({
      type: 'orders.create',
      input: Schema.Struct({ orderId: Schema.String, amount: Schema.Number }),
      execute: (input) => [
        {
          type: 'orders.created',
          payload: { orderId: input.orderId, amount: input.amount },
        },
      ],
    })

    const invoked = invoke(createEffect, { orderId: 'ord-1', amount: 20 }, 'tag-1')

    expect(invoked.type).toBe('orders.create')
    expect(invoked.input).toEqual({ orderId: 'ord-1', amount: 20 })
    expect(invoked.tag).toBe('tag-1')
  })

  test('defineModule requires services when effect requires environment', () => {
    const queryEffect = ordersModule.effect({
      type: 'orders.queryDb',
      execute: (_input, _ctx) =>
        DatabaseTag.pipe(
          Effect.flatMap((db) =>
            Effect.tryPromise({
              try: () => db.query('SELECT 1'),
              catch: (cause) => new Error(String(cause)),
            }),
          ),
          Effect.map(() => [] as const),
        ),
    })

    // Providing DatabaseTag satisfies the effect requirements
    const built = defineModule(ordersModule, () => ({
      effects: { queryDb: queryEffect },
      services: () =>
        Layer.succeed(DatabaseTag, {
          query: async () => 'ok',
        }),
    }))

    expect(built.namespace).toBe('orders')

    // Omitting services when an effect requires DatabaseTag should fail
    // @ts-expect-error services is required because queryDb requires DatabaseTag
    defineModule(ordersModule, () => ({
      effects: { queryDb: queryEffect },
    }))
  })

  test('compile-time type rejection assertions', () => {
    // 1. Invalid event type in switch should not have created payload properties
    ordersModule.thread({
      kind: 'test',
      initialState: () => ({}),
      step(state, event) {
        if (event.type === 'orders.created') {
          // @ts-expect-error nonExistent should not exist on orders.created payload
          const bad = event.payload.nonExistent
          expect(bad).toBeUndefined()
        }

        return state
      },
    })

    // 2. Invalid event key in scope.input
    // @ts-expect-error 'invalid_event' is not a key of ordersCatalog
    ordersModule.input('invalid_event', {})

    // 3. Invalid payload shape in scope.input
    // @ts-expect-error amount must be number, not string
    ordersModule.input('created', { orderId: '1', amount: 'not-a-number' })

    // 4. Invalid effect type must start with namespace
    ordersModule.effect({
      // @ts-expect-error effect type must start with orders.
      type: 'wrong_namespace.action',
      execute: () => [],
    })

    // 5. Invalid returned event type from effect execute
    ordersModule.effect({
      type: 'orders.badReturn',
      // @ts-expect-error 'orders.fake_event' is not in EventInputOf<U>
      execute: () => [{ type: 'orders.fake_event', payload: {} }],
    })

    // 6. Invalid ctx.emit in effect execute
    ordersModule.effect({
      type: 'orders.badEmit',
      execute: async (_input, ctx) => {
        // @ts-expect-error 'orders.fake_event' is not in EventInputOf<U>
        await ctx.emit({ type: 'orders.fake_event', payload: {} })

        return []
      },
    })

    // 7. Typed invoke rejects mismatched input shape
    const effectWithSchema = ordersModule.effect({
      type: 'orders.testInput',
      input: Schema.Struct({ count: Schema.Number }),
      execute: () => [],
    })

    // @ts-expect-error input must have count: number
    invoke(effectWithSchema, { count: 'string' })
  })

  test('defineModule produces clean RuntimeModule without leaking builder methods', () => {
    const built = defineModule(ordersModule, () => ({
      effects: {},
    }))

    expect(built.namespace).toBe('orders')
    expect(built.protocolVersion).toBe('1.0.0')
    expect(built).not.toHaveProperty('thread')
    expect(built).not.toHaveProperty('effect')
    expect(built).not.toHaveProperty('projection')
    expect(built).not.toHaveProperty('input')
    expect(built).not.toHaveProperty('emit')
  })

  test('preserves observes and dependencies when finished from scope', () => {
    const billingCatalog = defineEventCatalog('billing', {
      invoiced: payload<{ invoiceId: string }>(),
    })

    const shippingScope = createModuleScope({
      namespace: 'shipping',
      protocolVersion: '1.0.0',
      observes: [billingCatalog],
      dependencies: [{ namespace: 'billing' }],
    })

    const shippingModule = defineModule(shippingScope, () => ({
      effects: {},
    }))

    expect(shippingModule.observes).toEqual([billingCatalog])
    expect(shippingModule.dependencies).toEqual([{ namespace: 'billing' }])
  })
})
