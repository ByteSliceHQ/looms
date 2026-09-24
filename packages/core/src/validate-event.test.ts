import { describe, expect, test } from 'bun:test'

import { Effect, Schema } from 'effect'

import { defineEventCatalog, payload } from './catalog'
import { protocolCatalog } from './protocol'
import { InvalidEventError, validateEventInput, validateEventsEffect } from './validate-event'

describe('validateEventInput', () => {
  const testCatalog = defineEventCatalog('test', {
    typedOnly: payload<{ x: number }>(),
    schemaBacked: Schema.Struct({
      id: Schema.String,
      count: Schema.Finite,
    }),
  })

  const catalogs = [protocolCatalog, testCatalog]

  test('passes valid payload through schema validation', async () => {
    const input = {
      type: 'test.schemaBacked',
      payload: { id: 'abc', count: 123 },
    }

    const result = await Effect.runPromise(validateEventInput(catalogs, input))

    expect(result.type).toBe('test.schemaBacked')
    expect(result.payload).toEqual({ id: 'abc', count: 123 })
  })

  test('fails on invalid payload for schema-backed event', async () => {
    const input = {
      type: 'test.schemaBacked',
      payload: { id: 123, count: 'not-a-number' },
    }

    let caught: InvalidEventError | undefined

    try {
      await Effect.runPromise(validateEventInput(catalogs, input))
    } catch (err) {
      if (err instanceof InvalidEventError) {
        caught = err
      }
    }

    expect(caught).toBeDefined()
    expect(caught?.type).toBe('test.schemaBacked')
    expect(caught?.issues.length).toBeGreaterThan(0)
  })

  test('passes payload-only (compile-time marker) events without schema validation', async () => {
    const input = {
      type: 'test.typedOnly',
      payload: { anything: 'allowed at runtime' },
    }

    const result = await Effect.runPromise(validateEventInput(catalogs, input))

    expect(result.payload).toEqual({ anything: 'allowed at runtime' })
  })

  test('passes unknown event types through unchanged', async () => {
    const input = {
      type: 'foreign.event',
      payload: { arbitrary: true },
    }

    const result = await Effect.runPromise(validateEventInput(catalogs, input))

    expect(result.payload).toEqual({ arbitrary: true })
  })

  test('validates protocol events against protocolCatalog', async () => {
    const validProtocol = {
      type: 'runtime.run.started',
      payload: {
        rootThreadId: 't1',
        kind: 'agent',
        definitionName: 'test',
        input: { prompt: 'hi' },
      },
    }

    const result = await Effect.runPromise(validateEventInput(catalogs, validProtocol))

    expect(result.type).toBe('runtime.run.started')
    expect(result.payload).toMatchObject({ definitionVersion: 'v1' })

    const invalidProtocol = {
      type: 'runtime.run.started',
      payload: {
        rootThreadId: 123,
        kind: 'agent',
        definitionName: 'test',
        input: null,
      },
    }

    let caught: InvalidEventError | undefined

    try {
      await Effect.runPromise(validateEventInput(catalogs, invalidProtocol))
    } catch (err) {
      if (err instanceof InvalidEventError) {
        caught = err
      }
    }

    expect(caught).toBeDefined()
  })

  test('validateEventsEffect validates an entire batch', async () => {
    const batch = [
      { type: 'test.schemaBacked', payload: { id: '1', count: 1 } },
      { type: 'test.schemaBacked', payload: { id: '2', count: 2 } },
    ]

    const result = await Effect.runPromise(validateEventsEffect(catalogs, batch))

    expect(result.length).toBe(2)
  })
})
