import { resolve } from 'node:path'

import { Config, Data, Effect } from 'effect'

export class FixtureError extends Data.TaggedError('FixtureError')<{ readonly message: string }> {}

const files = [
  ['math.ts', 'c21752aa84650d8dd064ceb49b21dc0230fb4f7cf590ab2c8bb19fe68f273579'],
  ['math.test.ts', 'e22772c98631a9d7c8f2deb6f30be8e14aa6efe9b3763098dcbe59a0bb2fd556'],
] as const

/** The local and AX executors check the same immutable fixture and run the same test. */
export const checkFixture = Effect.gen(function* () {
  const directory = yield* Config.string('LOOMS_FIXTURE_DIR').pipe(
    Config.withDefault(resolve(import.meta.dirname, 'fixture')),
  )

  for (const [name, expected] of files) {
    const bytes = yield* Effect.tryPromise({
      try: () => Bun.file(resolve(directory, name)).arrayBuffer(),
      catch: () => new FixtureError({ message: `Cannot read fixture ${name}` }),
    })

    const actual = new Bun.CryptoHasher('sha256').update(bytes).digest('hex')

    if (actual !== expected) {
      return yield* new FixtureError({ message: `Fixture revision mismatch: ${name}` })
    }
  }

  const code = yield* Effect.tryPromise({
    try: (signal) =>
      Bun.spawn(['bun', 'test', resolve(directory, 'math.test.ts')], {
        stdout: 'ignore',
        stderr: 'ignore',
        signal,
      }).exited,
    catch: () => new FixtureError({ message: 'Fixture process failed' }),
  })

  if (code !== 0) {
    return yield* new FixtureError({ message: `Fixture checks exited ${String(code)}` })
  }

  return undefined
})
