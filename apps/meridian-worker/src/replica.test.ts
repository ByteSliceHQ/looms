import { describe, expect, test } from 'bun:test'

import { generateReplicaMigrations } from '@looms/projectors/replica/migrations'

describe('D1 replica migrations', () => {
  test('the committed sqlite migration matches the generator', async () => {
    const result = await generateReplicaMigrations({
      out: new URL('../migrations', import.meta.url).pathname,
      dialect: 'sqlite',
      check: true,
    })

    expect(result.pending).toEqual([])
  })
})
