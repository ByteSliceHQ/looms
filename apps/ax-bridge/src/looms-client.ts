import { Effect, Schema } from 'effect'

import { RunStateSchema } from '@looms/core'

import { BridgeError, io, type CallbackTarget, type Job } from './model'

const StateResponse = Schema.Struct({ state: RunStateSchema })

const HistoryResponse = Schema.Struct({
  events: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      payload: Schema.Json,
    }),
  ),
})

const Receipt = Schema.Struct({ effectId: Schema.String, attempt: Schema.optional(Schema.Finite) })
const decodeReceipt = Schema.decodeUnknownOption(Receipt)

const runPath = (job: Job) => `/runs/${encodeURIComponent(job.submission.task.runId)}`

export function loomsClient(
  target: CallbackTarget,
  transport: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response> = globalThis.fetch,
) {
  const base = target.endpoint.replace(/\/$/, '')

  const request = (path: string, token: string, body?: string) =>
    io(() =>
      transport(`${base}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
      }).then((response) => {
        if (!response.ok) {
          throw new BridgeError({ message: `Looms HTTP ${response.status}`, status: 503 })
        }

        return response.text()
      }),
    )

  return {
    state: (job: Job) =>
      request(runPath(job), target.readToken).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(StateResponse))),
        Effect.map(({ state }) => state),
      ),
    callback: (
      job: Job,
      kind: 'started' | 'heartbeat' | 'complete' | 'fail' | 'cancelled',
      body = '{}',
    ) => {
      const { effectId, attempt } = job.submission.task

      return request(
        `${runPath(job)}/effects/${encodeURIComponent(effectId)}/${attempt}/${kind}`,
        target.workerToken,
        body,
      ).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(StateResponse))),
        Effect.map(({ state }) => state),
      )
    },
    receipt: (job: Job, kind: string) =>
      request(`${runPath(job)}/events`, target.readToken).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(HistoryResponse))),
        Effect.map(({ events }) => {
          let latestAttempt: number | undefined

          for (const event of events) {
            const decoded = decodeReceipt(event.payload)

            if (
              decoded._tag !== 'Some' ||
              decoded.value.effectId !== job.submission.task.effectId
            ) {
              continue
            }

            if (event.type === 'runtime.effect.queued') {
              latestAttempt = decoded.value.attempt
            }

            if (
              event.type === `runtime.effect.${kind}` &&
              decoded.value.attempt === job.submission.task.attempt
            ) {
              return true
            }

            // Terminal failures omit attempt; require the preceding queued attempt in retained history.
            if (
              kind === 'retry.scheduled' &&
              event.type === 'runtime.effect.failed' &&
              latestAttempt === job.submission.task.attempt
            ) {
              return true
            }
          }

          return false
        }),
      ),
  }
}
