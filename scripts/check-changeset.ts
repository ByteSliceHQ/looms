/**
 * Fail pull requests that change published package source without a changeset.
 *
 * Skip when:
 * - not a pull request (local / push to main)
 * - PR title starts with `chore(release)`
 * - PR has label `skip-changeset`
 * - the diff does not touch package source that can affect `@swirls/looms`
 */

import { resolve } from 'node:path'

function usage(): never {
  console.error(
    'Usage: bun run scripts/check-changeset.ts --base <sha> --head <sha> [--title <pr title>] [--labels <csv>]',
  )

  process.exit(2)
}

function argValue(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag)

  if (index < 0) {
    return undefined
  }

  return argv[index + 1]
}

function isPackageSourcePath(path: string): boolean {
  if (!path.startsWith('packages/')) {
    return false
  }

  if (path.endsWith('.md')) {
    return false
  }

  if (/\.(test|spec)\./.test(path) || path.includes('/__tests__/') || path.includes('/test/')) {
    return false
  }

  return true
}

function isChangesetPath(path: string): boolean {
  return path.startsWith('.changeset/') && path.endsWith('.md') && path !== '.changeset/README.md'
}

async function changedFiles(base: string, head: string): Promise<readonly string[]> {
  const child = Bun.spawn(['git', 'diff', '--name-only', `${base}...${head}`], {
    cwd: resolve(import.meta.dirname, '..'),
    stderr: 'inherit',
    stdout: 'pipe',
  })

  const output = await new Response(child.stdout).text()
  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`git diff --name-only ${base}...${head} exited with ${exitCode}`)
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const argv = process.argv.slice(2)
const base = argValue(argv, '--base')
const head = argValue(argv, '--head')
const title = argValue(argv, '--title') ?? ''
const labelsCsv = argValue(argv, '--labels') ?? ''

if (!base || !head) {
  usage()
}

const labels = new Set(
  labelsCsv
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label.length > 0),
)

if (title.startsWith('chore(release)')) {
  console.log('Skipping changeset check for release PR.')
  process.exit(0)
}

if (labels.has('skip-changeset')) {
  console.log('Skipping changeset check because label skip-changeset is present.')
  process.exit(0)
}

const files = await changedFiles(base, head)
const packageSource = files.filter(isPackageSourcePath)
const changesets = files.filter(isChangesetPath)

if (packageSource.length === 0) {
  console.log('No published package source changes; changeset not required.')
  process.exit(0)
}

if (changesets.length > 0) {
  console.log(`Found changeset(s): ${changesets.join(', ')}`)
  process.exit(0)
}

console.error(
  [
    'This PR changes published package source but does not add a changeset.',
    '',
    'Changed package paths:',
    ...packageSource.map((path) => `  - ${path}`),
    '',
    'Add one with `bun run changeset` (usually a minor or patch for `@swirls/looms`),',
    'or apply the `skip-changeset` label when a version bump is intentionally not needed.',
  ].join('\n'),
)

process.exit(1)
