import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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

const requestedVersion = process.argv[2] ?? 'latest'
const fixture = await mkdtemp(join(tmpdir(), 'looms-npm-e2e-'))

try {
  await writeFile(
    join(fixture, 'package.json'),
    JSON.stringify(
      {
        private: true,
        type: 'module',
        dependencies: {
          '@swirls/looms': requestedVersion,
          zod: '^4.0.0',
        },
      },
      undefined,
      2,
    ),
  )

  await writeFile(
    join(fixture, 'echo-agent.mjs'),
    `import { z } from 'zod'

import { agent, defineAgent } from '@swirls/looms/agent'
import { createLooms } from '@swirls/looms'

const expected = 'hello from the npm package'
const echo = defineAgent({
  name: 'echo',
  instructions: 'Echo the user.',
  input: z.object({ text: z.string() }),
  runTurn: ({ input }) => ({
    message: { role: 'assistant', content: input.text },
    done: true,
    output: { text: input.text },
  }),
})

const looms = createLooms({
  modules: [agent({ definitions: [echo] })],
})

try {
  const { runId, state } = await looms.start(echo, { text: expected })
  const output = state.rootThreadId ? state.threads[state.rootThreadId]?.output : undefined

  if (state.status !== 'completed') {
    throw new Error(\`Expected completed status, received \${state.status}\`)
  }
  if (output?.text !== expected) {
    throw new Error(\`Expected echoed output, received \${JSON.stringify(output)}\`)
  }

  const events = await looms.getEvents(runId)
  if (events.length === 0) {
    throw new Error('Expected the completed run to contain events')
  }

  console.log(JSON.stringify({ runId, status: state.status, output, events: events.length }))
} finally {
  await looms.stop()
}
`,
  )

  await run(['bun', 'install', '--ignore-scripts'], fixture)
  const installedPackages = await run(['bun', 'pm', 'ls'], fixture)
  const output = await run(['bun', 'echo-agent.mjs'], fixture)

  console.log(installedPackages.trim())
  console.log(output.trim())
} finally {
  await rm(fixture, { force: true, recursive: true })
}
