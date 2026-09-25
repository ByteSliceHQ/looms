import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { createLooms } from '@swirls/looms'

import { demoModules } from './runtime'

const decodeCatalog = Schema.decodeUnknownSync(
  Schema.Struct({
    definitions: Schema.Array(
      Schema.Struct({
        kind: Schema.String,
        name: Schema.String,
        inputSchema: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
      }),
    ),
    projections: Schema.Array(Schema.String),
  }),
)

describe('demo definitions', () => {
  test('publishes runnable definitions and projections', async () => {
    const looms = createLooms({ modules: demoModules() })
    const response = await looms.fetch(new Request('http://looms.test/definitions'))
    const body = decodeCatalog(await response?.json())

    expect(response?.status).toBe(200)
    expect(body.definitions.map((definition) => definition.name)).toContain('checkout')

    expect(
      body.definitions.find((definition) => definition.name === 'checkout')?.inputSchema,
    ).toMatchObject({
      type: 'object',
    })

    expect(body.projections).toEqual(
      expect.arrayContaining(['pendingApprovals', 'nodes', 'ledger']),
    )

    await looms.stop()
  })
})
