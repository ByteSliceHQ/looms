import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { Schema } from 'effect'

const ManifestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  version: Schema.String,
})

async function run(command: readonly string[], cwd: string): Promise<void> {
  const child = Bun.spawn([...command], {
    cwd,
    env: process.env,
    stderr: 'inherit',
    // Forward stdout so changesets/action can parse `New tag:` lines and
    // push git tags / create GitHub releases.
    stdout: 'inherit',
  })

  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} exited with ${exitCode}`)
  }
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
  console.log(
    `${name}@${version} is already published on npm; creating any missing git tags for the release action.`,
  )
  // `changeset publish` skips already-published versions and does not create
  // tags. `changeset tag` still emits `New tag:` for missing tags so the
  // action can push them and open the GitHub release.
  await run(['bun', 'x', 'changeset', 'tag'], root)
  process.exit(0)
}

console.log(`${name}@${version} is not yet published on npm; preparing and publishing...`)
await run(['bun', 'run', 'check:package'], root)
await run(['bun', 'x', 'changeset', 'publish'], root)
