import { chmod, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const packagesRoot = fileURLToPath(new URL('../..', import.meta.url))
const outputRoot = join(packageRoot, 'dist')

const modules = [
  'actor',
  'agent',
  'ai-vercel',
  'approval',
  'cli',
  'client',
  'cloudflare',
  'core',
  'debugger',
  'evaluator',
  'projectors',
  'react',
  'runtime',
  's2',
  'testing',
  'workflow',
] as const

const packageNames = new Map(modules.map((name) => [`@looms/${name}`, `@swirls/looms/${name}`]))
const relativeModuleSpecifier = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.\.?\/[^'"]+)\2/g

async function copyBuild(moduleName: (typeof modules)[number]): Promise<void> {
  const source = join(packagesRoot, moduleName, 'dist')

  try {
    if (!(await stat(source)).isDirectory()) {
      throw new Error('not a directory')
    }
  } catch {
    throw new Error(
      `Missing ${source}; build workspace dependencies before assembling @swirls/looms`,
    )
  }

  await cp(source, join(outputRoot, moduleName), {
    recursive: true,
    filter: (path) => !path.endsWith('.map'),
  })
}

async function rewriteImports(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      await rewriteImports(path)
      continue
    }

    if (!['.js', '.d.ts'].some((extension) => path.endsWith(extension))) {
      continue
    }

    let contents = await readFile(path, 'utf8')

    contents = contents.replaceAll(/^\/\/[#@] sourceMappingURL=.*$/gm, '')

    if (path.endsWith('.js')) {
      contents = contents.replace(
        relativeModuleSpecifier,
        (match, prefix: string, quote: string, specifier: string) =>
          /\.[a-z\d]+$/i.test(specifier) ? match : `${prefix}${quote}${specifier}.js${quote}`,
      )
    }

    for (const [from, to] of packageNames) {
      contents = contents.replaceAll(from, to)
    }

    await writeFile(path, contents)
  }
}

await rm(outputRoot, { recursive: true, force: true })

await mkdir(outputRoot, { recursive: true })

await Promise.all(modules.map(copyBuild))

await cp(
  join(packagesRoot, 'debugger', 'src', 'styles.css'),
  join(outputRoot, 'debugger', 'styles.css'),
)

await chmod(join(outputRoot, 'cli', 'cli.js'), 0o755)

await writeFile(
  join(outputRoot, 'index.js'),
  "export * from './core/index.js'\nexport * from './runtime/index.js'\n",
)

await writeFile(
  join(outputRoot, 'index.d.ts'),
  "export * from './core/index.js'\nexport * from './runtime/index.js'\n",
)

await rewriteImports(outputRoot)

const debuggerApp = fileURLToPath(new URL('../../../apps/debugger/dist', import.meta.url))

await cp(debuggerApp, join(outputRoot, 'debugger', 'app'), {
  recursive: true,
})
