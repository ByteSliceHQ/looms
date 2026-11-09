import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Effect, Exit, Layer } from 'effect'
import { TestConsole } from 'effect/testing'

import { cliTestLayer, runCli } from './commands'

const testLayer = Layer.mergeAll(TestConsole.layer, cliTestLayer)

const run = (argv: ReadonlyArray<string>) => {
  const program = Effect.gen(function* () {
    const exit = yield* Effect.exit(runCli(argv))
    const logs = yield* TestConsole.logLines
    const errors = yield* TestConsole.errorLines
    return {
      exit,
      out: logs.map(String).join('\n'),
      err: errors.map(String).join('\n'),
    }
  })

  // This test runner is the lifecycle boundary for its complete test layer.
  // oxlint-disable-next-line effecttsgo/strict-effect-provide
  return program.pipe(Effect.provide(testLayer), Effect.runPromise)
}

describe('@looms/cli', () => {
  test('--help prints usage', async () => {
    const { exit, out } = await run(['--help'])
    expect(Exit.isSuccess(exit)).toBe(true)
    expect(out).toContain('serve')
    expect(out).toContain('start')
    expect(out).toContain('approve')
    expect(out).toContain('--url')
  })

  test('root with no args shows help', async () => {
    const { out } = await run([])
    expect(out).toContain('SUBCOMMANDS')
  })

  test('unknown command fails', async () => {
    const { exit, out, err } = await run(['nope'])
    expect(Exit.isFailure(exit)).toBe(true)
    const text = `${out}\n${err}`
    expect(text.toLowerCase()).toMatch(/unknown|did you mean|nope/)
  })

  describe('replica generate --config', () => {
    const directories: string[] = []

    afterEach(async () => {
      await Promise.all(
        directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
      )
    })

    const withConfig = async (source: string) => {
      const directory = await mkdtemp(join(tmpdir(), 'looms-cli-'))
      directories.push(directory)
      const config = join(directory, 'attributes.ts')
      await writeFile(config, source)
      return { out: join(directory, 'migrations'), config }
    }

    test('writes a column and an index migration for each declared attribute', async () => {
      const { out, config } = await withConfig(
        'export const attributes = { tenantId: { required: true, index: true } }\n',
      )

      const result = await run([
        'replica',
        'generate',
        '--dialect',
        'sqlite',
        '--out',
        out,
        '--config',
        config,
      ])

      expect(Exit.isSuccess(result.exit)).toBe(true)

      expect(result.out.split('\n')).toEqual([
        '0000_looms_0001_replica.sql',
        '0001_looms_column_tenant_id.sql',
        '0002_looms_index_tenant_id.sql',
      ])
    })

    test('refuses an attribute whose column name is invalid', async () => {
      const { out, config } = await withConfig(
        "export default { tenant: { fieldName: 'Tenant' } }\n",
      )

      const result = await run(['replica', 'generate', '--out', out, '--config', config])

      expect(Exit.isFailure(result.exit)).toBe(true)
      expect(`${result.out}\n${result.err}`).toMatch(/lowercase snake_case/)
    })
  })
})
