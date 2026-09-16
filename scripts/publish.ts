import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { Schema } from 'effect'

const ManifestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  version: Schema.String,
})

async function run(command: readonly string[], cwd: string): Promise<string> {
  const child = Bun.spawn([...command], {
    cwd,
    env: process.env,
    stderr: 'inherit',
    stdout: 'pipe',
  })

  const output = await new Response(child.stdout).text()
  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} exited with ${exitCode}`)
  }

  return output
}

const root = resolve(import.meta.dirname, '..')
const packageJsonPath = join(root, 'packages', 'looms', 'package.json')
const rawManifest: unknown = JSON.parse(await readFile(packageJsonPath, 'utf8'))
const manifest = Schema.decodeUnknownSync(ManifestSchema)(rawManifest)

const name = manifest.name ?? '@swirls/looms'
const version = manifest.version

// Fast check: is this version already live on the npm registry?
const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`
const response = await fetch(registryUrl, { method: 'HEAD' })

if (response.ok) {
  console.log(`${name}@${version} is already published on npm; skipping build and publish.`)
  process.exit(0)
}

console.log(`${name}@${version} is not yet published on npm; preparing and publishing...`)
await run(['bun', 'run', 'check:package'], root)
await run(['bun', 'x', 'changeset', 'publish'], root)
