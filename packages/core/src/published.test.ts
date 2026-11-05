import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEffect } from './effects'
import { defineRuntimeModule } from './module'
import { publishEffects, publishModules } from './published'

describe('publishEffects', () => {
  test('publishes placement with the rest of each declared effect', () => {
    const charge = defineEffect({
      type: 'billing.charge',
      placement: 'local',
      deterministic: true,
      input: Schema.Struct({ amount: Schema.Finite }),
      retry: { maxAttempts: 3, backoffMs: 100 },
      execute: () => [],
    })

    const capture = defineEffect({
      type: 'billing.capture',
      placement: 'worker',
      retry: {
        maxAttempts: 2,
        scheduleToStartTimeoutMs: 1_000,
        startToCloseTimeoutMs: 5_000,
      },
    })

    const effects = publishEffects([charge, capture])

    expect(effects.map((effect) => effect.type)).toEqual(['billing.capture', 'billing.charge'])

    expect(effects[0]).toEqual({
      type: 'billing.capture',
      placement: 'worker',
      retry: {
        maxAttempts: 2,
        scheduleToStartTimeoutMs: 1_000,
        startToCloseTimeoutMs: 5_000,
      },
    })

    expect(effects[1]).toMatchObject({
      type: 'billing.charge',
      placement: 'local',
      deterministic: true,
      retry: { maxAttempts: 3, backoffMs: 100 },
    })

    expect(effects[1]?.inputSchema).toMatchObject({ type: 'object' })

    expect(effects[1]).not.toHaveProperty('execute')
  })
})

describe('publishModules', () => {
  test('publishes namespace, protocol version, and description in registration order', () => {
    const billing = defineRuntimeModule({
      namespace: 'billing',
      protocolVersion: '1.0.0',
      description: 'Card charges',
    })

    const notes = defineRuntimeModule({
      namespace: 'notes',
      protocolVersion: '2.0.0',
    })

    expect(publishModules([billing, notes])).toEqual([
      { namespace: 'billing', protocolVersion: '1.0.0', description: 'Card charges' },
      { namespace: 'notes', protocolVersion: '2.0.0' },
    ])
  })
})
