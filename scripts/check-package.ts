import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'

async function run(command: readonly string[], cwd: string): Promise<string> {
  const child = Bun.spawn(command, {
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
const packageRoot = join(root, 'packages', 'looms')
const temporaryRoot = await mkdtemp(join(tmpdir(), 'looms-package-'))

try {
  await run(['bun', 'x', 'turbo', 'run', 'build', '--filter=@swirls/looms...'], root)

  const npm = Bun.which('npm')

  const packOutput = npm
    ? await run([npm, 'pack', '--json', '--pack-destination', temporaryRoot], packageRoot)
    : await run(['bun', 'pm', 'pack', '--quiet', '--destination', temporaryRoot], packageRoot)

  const npmFilenamePattern = /"filename"\s*:\s*"([^"]+)"/
  const filename = npm ? npmFilenamePattern.exec(packOutput)?.[1] : packOutput.trim()

  if (!filename) {
    throw new Error('Package manager did not return an artifact filename')
  }

  const tarball = isAbsolute(filename) ? filename : join(temporaryRoot, filename)

  const packedFiles = await run(['tar', '-tzf', tarball], root)

  const paths = new Set(
    packedFiles
      .split('\n')
      .filter(Boolean)
      .map((path) => path.replace(/^package\//, '')),
  )

  const forbidden = [...paths].filter(
    (path) =>
      path.includes('/src/') ||
      path.endsWith('.test.js') ||
      path.endsWith('.test.d.ts') ||
      path.endsWith('.map'),
  )

  if (forbidden.length > 0) {
    throw new Error(`Tarball contains forbidden files:\n${forbidden.join('\n')}`)
  }

  const required = [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/core/index.js',
    'dist/runtime/index.js',
    'dist/debugger/styles.css',
    'dist/debugger/app/index.html',
    'dist/debugger/server/index.js',
    'dist/cli/cli.js',
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
  ]

  const missing = required.filter((path) => !paths.has(path))

  if (missing.length > 0) {
    throw new Error(`Tarball is missing:\n${missing.join('\n')}`)
  }

  const debuggerStyles = await readFile(join(packageRoot, 'dist/debugger/styles.css'), 'utf8')

  const debuggerSources = [...debuggerStyles.matchAll(/@source "([^"]+)";/g)].map(
    (match) => match[1] ?? '',
  )

  if (
    debuggerSources.length < 2 ||
    debuggerSources.some((source) => !source.endsWith('/**/*.js')) ||
    debuggerStyles.includes('{ts,tsx}') ||
    !debuggerSources.some((source) => source.startsWith('../'))
  ) {
    throw new Error('dist/debugger/styles.css was not rewritten to scan built .js views')
  }

  const uiImport =
    /\b(?:from|import)\s*\(?\s*['"](?:react(?:\/[^'"]*)?|[^'"]*\/(?:react|debugger)(?:\/[^'"]*)?)['"]/

  for (const entry of ['agent', 'approval', 'workflow']) {
    const entryRoot = join(packageRoot, 'dist', entry)

    for (const file of new Bun.Glob('**/*.js').scanSync(entryRoot)) {
      if (file.startsWith('debugger/')) {
        continue
      }

      if (uiImport.test(await readFile(join(entryRoot, file), 'utf8'))) {
        throw new Error(`@swirls/looms/${entry}/${file} imports react or debugger UI`)
      }
    }
  }

  const fixture = join(temporaryRoot, 'fixture')

  await mkdir(fixture)

  await writeFile(
    join(fixture, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, undefined, 2),
  )

  const peerPackages = [
    '@cloudflare/workers-types',
    'ai@^7',
    'postgres@^3',
    'react@^19',
    'react-dom@^19',
  ]

  if (npm) {
    await run(
      [npm, 'install', '--ignore-scripts', '--no-package-lock', tarball, ...peerPackages],
      fixture,
    )
  } else {
    await run(['bun', 'add', '--ignore-scripts', tarball, ...peerPackages], fixture)
  }

  const imports = [
    '@swirls/looms',
    '@swirls/looms/actor',
    '@swirls/looms/agent',
    '@swirls/looms/agent/debugger',
    '@swirls/looms/ai-vercel',
    '@swirls/looms/approval',
    '@swirls/looms/approval/debugger',
    '@swirls/looms/client',
    '@swirls/looms/core',
    '@swirls/looms/debugger',
    '@swirls/looms/debugger/server',
    '@swirls/looms/evaluator',
    '@swirls/looms/projectors',
    '@swirls/looms/react',
    '@swirls/looms/runtime',
    '@swirls/looms/s2',
    '@swirls/looms/testing',
    '@swirls/looms/workflow',
    '@swirls/looms/workflow/debugger',
  ]

  const staticImports = imports
    .map((specifier, index) => `import * as module${index} from '${specifier}'`)
    .join('\n')

  await writeFile(join(fixture, 'smoke.mjs'), `${staticImports}\nconsole.log('imports ok')\n`)

  await writeFile(join(fixture, 'smoke.ts'), `${staticImports}\nvoid module0\n`)

  await writeFile(
    join(fixture, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          lib: ['ES2022', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
          types: ['@cloudflare/workers-types'],
        },
        include: ['smoke.ts'],
      },
      undefined,
      2,
    ),
  )

  await writeFile(
    join(fixture, 'debugger.mjs'),
    `import { createLooms } from '@swirls/looms'
import { debuggerUi } from '@swirls/looms/debugger/server'

const looms = createLooms({ debugger: debuggerUi() })

try {
  const page = await looms.fetch(new Request('http://looms.test/debugger'))
  const html = await page?.text()

  if (page?.status !== 200 || !html?.includes('<base href="/debugger/">')) {
    throw new Error('debugger UI did not serve its shell')
  }
} finally {
  await looms.stop()
}
`,
  )

  await run(['bun', 'smoke.mjs'], fixture)
  await run(['bun', 'debugger.mjs'], fixture)

  const node = Bun.which('node')

  if (node) {
    await run([node, 'smoke.mjs'], fixture)
  }

  await run([join(root, 'node_modules', '.bin', 'tsc'), '--noEmit', '-p', 'tsconfig.json'], fixture)
  await run(['bun', join(fixture, 'node_modules', '.bin', 'looms'), '--help'], fixture)

  console.log('Validated @swirls/looms packed artifact')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
