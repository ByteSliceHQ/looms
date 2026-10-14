import { Effect } from 'effect'
import { z } from 'zod'

import { checkFixture } from './check-fixture'

export const AnalysisInput = z.object({
  revision: z.literal('fixture-v1'),
  networkProbe: z.boolean().default(false),
  delayMs: z.number().int().min(0).max(120_000).default(0),
  failAttempts: z.number().int().min(0).max(2).default(0),
})

export const AnalysisResult = z.object({
  revision: z.literal('fixture-v1'),
  sourceFiles: z.literal(1),
  testFiles: z.literal(1),
  testsPassed: z.literal(1),
  network: z.object({ allowed: z.boolean(), denied: z.boolean() }).optional(),
})

export const result = {
  revision: 'fixture-v1',
  sourceFiles: 1,
  testFiles: 1,
  testsPassed: 1,
} as const

export function localAnalysis(input: z.infer<typeof AnalysisInput>) {
  return Effect.sleep(input.delayMs).pipe(
    Effect.andThen(checkFixture),
    Effect.as([{ type: 'repository.analyzed' as const, payload: result }]),
  )
}
