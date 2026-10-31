import { readFileSync, writeFileSync } from 'node:fs'

export function buildDeployConfig(raw, options) {
  const json = raw.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1')
  const config = JSON.parse(json)
  const prefix = options.prefix || 'meridian'
  const databases = config.d1_databases
  const producers = config.queues?.producers
  const consumers = config.queues?.consumers

  if (!Array.isArray(databases) || databases.length === 0) {
    throw new Error('wrangler.jsonc is missing d1_databases')
  }

  if (
    !Array.isArray(producers) ||
    producers.length === 0 ||
    !Array.isArray(consumers) ||
    consumers.length === 0
  ) {
    throw new Error('wrangler.jsonc is missing the order queue')
  }

  config.name = prefix
  producers[0].queue = `${prefix}-orders`
  consumers[0].queue = `${prefix}-orders`
  databases[0].database_name = `${prefix}-replica`
  databases[0].database_id = options.d1Id
  databases[0].migrations_dir = 'migrations'

  // Local dev keeps this placeholder in wrangler.jsonc. Production sets it with
  // `wrangler secret put`. A var and a secret cannot share a name.
  if (config.vars) {
    delete config.vars.LOOMS_WORKER_TOKEN
  }

  config.assets = {
    directory: '../meridian-ui/dist',
    binding: 'ASSETS',
    not_found_handling: 'single-page-application',
    run_worker_first: ['/api/*', '/runs', '/runs/*', '/definitions', '/definitions/*', '/health'],
  }

  return `${JSON.stringify(config, null, 2)}\n`
}

const entry = process.argv[1] ?? ''
const id = process.argv[2]
const out = process.argv[3]

if (entry.endsWith('deploy-config.mjs')) {
  if (!id || !out) {
    console.error('usage: deploy-config.mjs <d1-database-id> <out>')
    process.exit(1)
  }

  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
  const prefix = process.env.MERIDIAN_PREFIX || 'meridian'
  writeFileSync(out, buildDeployConfig(raw, { d1Id: id, prefix }))
}
