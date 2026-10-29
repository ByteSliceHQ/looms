import { expect, test } from 'bun:test'
import { join } from 'node:path'

import { generateReplicaMigrations } from '@looms/projectors/replica/migrations'

test('committed replica SQL matches looms replica generate', async () => {
  const result = await generateReplicaMigrations({
    out: join(import.meta.dir, '../migrations'),
    check: true,
  })

  expect(result.pending).toEqual([])
})
