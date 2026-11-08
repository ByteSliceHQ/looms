import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import {
  composeModules,
  defineEventCatalog,
  defineProjection,
  defineRuntimeModule,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  payload,
  type AnyRuntimeModule,
  type ModuleExample,
} from '@looms/core'

import { moduleExampleErrors } from './module-examples'

type NoteState = {
  readonly n: number
  readonly note?: string
}

const sampleEvents = defineEventCatalog('sample', {
  ping: Schema.Struct({ n: Schema.Finite, note: Schema.optional(Schema.String) }),
})

const count = defineProjection({
  name: 'count',
  initialState: { n: 0 },
  reduce(state, event) {
    if (event.type !== 'sample.ping' || !isJsonObject(event.payload)) {
      return state
    }

    return isJsonNumber(event.payload.n) ? { n: state.n + event.payload.n } : state
  },
})

const last = defineProjection({
  name: 'last',
  initialState: { n: 0 } satisfies NoteState,
  reduce(state: NoteState, event): NoteState {
    if (event.type !== 'sample.ping' || !isJsonObject(event.payload)) {
      return state
    }

    const { n, note } = event.payload

    if (!isJsonNumber(n)) {
      return state
    }

    return isJsonString(note) ? { n, note } : { n }
  },
})

function sample(examples: readonly ModuleExample[]) {
  return defineRuntimeModule({
    namespace: 'sample',
    protocolVersion: '1.0.0',
    events: sampleEvents,
    projections: { count, tally: { ...count, name: 'tallied' }, last },
    examples,
  })
}

function errorsOf(module: AnyRuntimeModule): readonly string[] {
  return moduleExampleErrors(module, composeModules([module]).catalogs)
}

const ping = (n: number | string) => ({ type: 'sample.ping', payload: { n } })

describe('moduleExampleErrors', () => {
  test('accepts a trace that folds to the declared projection state', () => {
    expect(
      errorsOf(
        sample([{ name: 'ping adds', events: [ping(2)], projections: { count: { n: 2 } } }]),
      ),
    ).toEqual([])
  })

  test('reports a projection that does not match the trace', () => {
    expect(
      errorsOf(
        sample([{ name: 'ping adds', events: [ping(2)], projections: { count: { n: 0 } } }]),
      ),
    ).toEqual(['example ping adds projection count: expected {"n":0}, got {"n":2}'])
  })

  test('reports an event the catalog does not own', () => {
    expect(
      errorsOf(
        sample([
          {
            name: 'elsewhere',
            events: [{ type: 'billing.charged', payload: {} }],
            projections: { count: { n: 0 } },
          },
        ]),
      ),
    ).toEqual(['example elsewhere event billing.charged is outside the module catalogs'])
  })

  test('reports a payload the catalog schema rejects', () => {
    const [error] = errorsOf(
      sample([{ name: 'bad ping', events: [ping('two')], projections: { count: { n: 0 } } }]),
    )

    expect(error).toContain('example bad ping event sample.ping: Invalid payload')
  })

  test('reports missing names, duplicates, and empty traces', () => {
    expect(
      errorsOf(
        sample([
          { name: ' ', events: [ping(1)], projections: { count: { n: 1 } } },
          { name: 'twice', events: [ping(1)], projections: { count: { n: 1 } } },
          { name: 'twice', events: [], projections: {} },
        ]),
      ),
    ).toEqual([
      'module example is missing a name',
      'duplicate example twice',
      'example twice has no events',
      'example twice names no projections',
    ])
  })

  test('accepts a catalog entry without a runtime schema', () => {
    const typed = defineRuntimeModule({
      namespace: 'sample',
      protocolVersion: '1.0.0',
      events: defineEventCatalog('sample', { ping: payload<{ n: number }>() }),
      projections: { count },
      examples: [{ name: 'ping', events: [ping(1)], projections: { count: { n: 1 } } }],
    })

    expect(errorsOf(typed)).toEqual([])
  })

  test('looks projections up by member key, not projection name', () => {
    expect(
      errorsOf(
        sample([
          { name: 'aliased', events: [ping(2)], projections: { tally: { n: 2 } } },
          { name: 'by name', events: [ping(2)], projections: { tallied: { n: 2 } } },
        ]),
      ),
    ).toEqual(['example by name names unknown projection tallied'])
  })

  test('strips undefined fields before comparing projection state', () => {
    expect(
      errorsOf(sample([{ name: 'no note', events: [ping(3)], projections: { last: { n: 3 } } }])),
    ).toEqual([])
  })
})
