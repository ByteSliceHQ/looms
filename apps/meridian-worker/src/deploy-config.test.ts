import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

import { buildDeployConfig } from '../scripts/deploy-config.mjs'

describe('deploy config', () => {
  test('writes the real D1 id, prefixed names, and no worker token var', () => {
    const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')

    const written = buildDeployConfig(raw, {
      d1Id: '11111111-1111-4111-8111-111111111111',
      prefix: 'meridian-two',
    })

    const config = JSON.parse(written)

    expect(config.name).toBe('meridian-two')
    expect(config.queues.producers[0].queue).toBe('meridian-two-orders')
    expect(config.queues.consumers[0].queue).toBe('meridian-two-orders')
    expect(config.d1_databases[0].database_name).toBe('meridian-two-replica')
    expect(config.d1_databases[0].database_id).toBe('11111111-1111-4111-8111-111111111111')
    expect(config.vars.LOOMS_WORKER_TOKEN).toBeUndefined()
    expect(config.assets.directory).toBe('../meridian-ui/dist')
    expect(config.assets.run_worker_first).toContain('/api/*')
    expect(config.triggers.crons).toEqual(['30 13 * * 1-5', '5 20 * * 1-5'])
  })
})
