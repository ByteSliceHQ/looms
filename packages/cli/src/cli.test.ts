import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { TestConsole } from 'effect/testing'
import { cliTestLayer, runCli } from './commands'

const run = (argv: ReadonlyArray<string>) =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(runCli(argv))
    const logs = yield* TestConsole.logLines
    const errors = yield* TestConsole.errorLines
    return {
      exit,
      out: logs.map(String).join('\n'),
      err: errors.map(String).join('\n'),
    }
  }).pipe(Effect.provide(TestConsole.layer), Effect.provide(cliTestLayer), Effect.runPromise)

describe('@looms/cli', () => {
  test('--help prints usage', async () => {
    const { exit, out } = await run(['--help'])
    expect(exit._tag).toBe('Success')
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
    expect(exit._tag).toBe('Failure')
    const text = `${out}\n${err}`
    expect(text.toLowerCase()).toMatch(/unknown|did you mean|nope/)
  })
})
