import { describe, expect, test } from 'bun:test'

import { Schema } from 'effect'

import { createLooms } from '@swirls/looms'
import { DefinitionCatalogSchema } from '@swirls/looms/core'

import { demoModules } from './runtime'

const decodeCatalog = Schema.decodeUnknownSync(DefinitionCatalogSchema)

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
