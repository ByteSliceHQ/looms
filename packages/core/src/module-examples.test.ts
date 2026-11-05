import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { defineEventCatalog, payload } from './catalog'
import { defineRuntimeModule } from './module'
import { moduleExampleErrors } from './module-examples'
import { defineProjection } from './projection'
import { isJsonNumber, isJsonObject } from './types'

const counted = defineRuntimeModule({
  namespace: 'sample',
  protocolVersion: '1.0.0',
  events: defineEventCatalog('sample', {
    ping: Schema.Struct({ n: Schema.Finite }),
  }),
  projections: {
    count: defineProjection({
      name: 'count',
      initialState: { n: 0 },
      reduce(state, event) {
        if (event.type !== 'sample.ping') {
          return state
        }

        if (!isJsonObject(event.payload) || !isJsonNumber(event.payload.n)) {
          return state
        }

        return { n: state.n + event.payload.n }
      },
    }),
  },
  examples: [
    {
      name: 'ping adds',
      events: [{ type: 'sample.ping', payload: { n: 2 } }],
      projections: { count: { n: 2 } },
    },
  ],
})

describe('moduleExampleErrors', () => {
  test('accepts a trace that folds to the declared projection state', () => {
    expect(moduleExampleErrors(counted)).toEqual([])
  })

  test('reports a projection that does not match the trace', () => {
    const drifted = defineRuntimeModule({
      ...counted,
      examples: [
        {
          name: 'ping adds',
          events: [{ type: 'sample.ping', payload: { n: 2 } }],
          projections: { count: { n: 0 } },
        },
      ],
    })

    expect(moduleExampleErrors(drifted).some((error) => error.includes('projection count'))).toBe(
      true,
    )
  })

  test('reports an event the catalog does not own', () => {
    const foreign = defineRuntimeModule({
      ...counted,
      examples: [
        {
          name: 'elsewhere',
          events: [{ type: 'billing.charged', payload: {} }],
          projections: { count: { n: 0 } },
        },
      ],
    })

    expect(moduleExampleErrors(foreign)).toEqual([
      'example elsewhere event billing.charged is outside the module catalogs',
    ])
  })

  test('reports a payload the catalog schema rejects', () => {
    const invalid = defineRuntimeModule({
      ...counted,
      examples: [
        {
          name: 'bad ping',
          events: [{ type: 'sample.ping', payload: { n: 'two' } }],
          projections: { count: { n: 0 } },
        },
      ],
    })

    expect(moduleExampleErrors(invalid)[0]).toContain('example bad ping event sample.ping')
  })

  test('reports an example that names no projection', () => {
    const bare = defineRuntimeModule({
      namespace: 'sample',
      protocolVersion: '1.0.0',
      events: defineEventCatalog('sample', {
        ping: payload<{ n: number }>(),
      }),
      examples: [
        {
          name: 'ping',
          events: [{ type: 'sample.ping', payload: { n: 1 } }],
          projections: {},
        },
      ],
    })

    expect(moduleExampleErrors(bare)).toEqual(['example ping names no projections'])
  })
})
