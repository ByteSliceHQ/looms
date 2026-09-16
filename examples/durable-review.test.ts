import { expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { z } from 'zod'

const started = z.object({ runId: z.string(), status: z.string() })

for (const choice of ['approve', 'reject'] as const) {
  test(`a new process can ${choice} a persisted review`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'looms-review-'))

    async function run(args: string[]) {
      const child = Bun.spawn(
        [process.execPath, join(import.meta.dir, 'durable-review.ts'), ...args],
        {
          env: { ...process.env, LOOMS_DB: join(dir, 'review.sqlite') },
          stdout: 'pipe',
          stderr: 'pipe',
        },
      )

      const output = await new Response(child.stdout).text()
      const errors = await new Response(child.stderr).text()
      expect(await child.exited, errors).toBe(0)
      return output
    }

    try {
      const first = await run(['start'])
      const { runId } = started.parse(JSON.parse(first.split('\n')[0]!))
      const before = await run(['inspect', runId])
      expect(before).toContain('"status": "pending"')
      const after = await run([choice, runId])
      expect(after).toContain('"status": "completed"')
      expect(after).toContain(`"published": ${choice === 'approve'}`)
      const recovered = await run(['inspect', runId])
      expect(recovered).toContain(`"published": ${choice === 'approve'}`)
      expect(recovered).toContain('agent.tool.result')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}
