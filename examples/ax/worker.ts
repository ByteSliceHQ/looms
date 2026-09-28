import { Effect } from 'effect'
import { FetchHttpClient, HttpClient } from 'effect/unstable/http'

import { runAxHandler } from '@swirls/looms/ax/worker'

import { AnalysisInput, result } from './analysis'
import { checkFixture } from './check-fixture'

const probe = (url: string) =>
  HttpClient.get(url).pipe(
    Effect.map((response) => response.status >= 200 && response.status < 300),
    Effect.timeout('5 seconds'),
    Effect.orElseSucceed(() => false),
  )

const bridgeEndpoint = process.env.LOOMS_AX_ENDPOINT ?? ''
const abort = new AbortController()
process.once('SIGTERM', () => abort.abort())
process.once('SIGINT', () => abort.abort())

await runAxHandler({
  endpoint: bridgeEndpoint,
  jobId: process.env.LOOMS_AX_JOB_ID ?? '',
  token: process.env.LOOMS_AX_CAPABILITY ?? '',
  signal: abort.signal,
  handle: (assignment, signal) =>
    Effect.runPromise(
      Effect.gen(function* () {
        const input = AnalysisInput.parse(assignment.task.input)
        yield* Effect.sleep(input.delayMs)

        if (assignment.task.attempt <= input.failAttempts) {
          return { kind: 'fail' as const, error: 'Injected fixture failure' }
        }

        yield* checkFixture
        let network: { allowed: boolean; denied: boolean } | undefined

        if (input.networkProbe) {
          const allowed = yield* probe(`${bridgeEndpoint}/health`)
          const denied = !(yield* probe('http://looms.looms-ax-test.svc.cluster.local:8790/health'))
          network = { allowed, denied }
        }

        return {
          kind: 'complete' as const,
          events: [
            { type: 'repository.analyzed', payload: network ? { ...result, network } : result },
          ],
        }
      }).pipe(
        // The worker process is the application entry point for this HTTP client layer.
        // oxlint-disable-next-line effecttsgo/strict-effect-provide
        Effect.provide(FetchHttpClient.layer),
      ),
      { signal },
    ),
})
