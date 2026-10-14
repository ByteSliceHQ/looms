import { Effect, Schedule, Schema } from 'effect'

import { stringifyJson } from '@looms/core'

import { AxAssignmentSchema, AxError, type AxAssignment, type AxOutcome } from './protocol'

export interface AxHandlerOptions {
  readonly endpoint: string
  readonly jobId: string
  readonly token: string
  readonly handle: (assignment: AxAssignment, signal: AbortSignal) => Promise<AxOutcome>
  readonly heartbeatMs?: number
  readonly signal?: AbortSignal
  readonly fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
}

/** One process owns one attempt. A restarted process gets a new instance and cannot rerun it. */
export function runAxHandler(options: AxHandlerOptions): Promise<void> {
  const url = new URL(options.endpoint)
  const heartbeatMs = options.heartbeatMs ?? 15_000

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !options.jobId ||
    !options.token ||
    !Number.isFinite(heartbeatMs) ||
    heartbeatMs < 1
  ) {
    throw new AxError('Invalid AX handler endpoint, credentials, or heartbeat interval')
  }

  // A process identity crosses restarts and must not repeat under deterministic Effect test seeds.
  // oxlint-disable-next-line effecttsgo/crypto-random-uuid
  const instance = crypto.randomUUID()
  const transport = options.fetch ?? globalThis.fetch
  const endpoint = url.href.replace(/\/$/, '')

  const call = (action: string, body: string) =>
    Effect.tryPromise({
      try: (signal) =>
        transport(`${endpoint}/v1/jobs/${encodeURIComponent(options.jobId)}/${action}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${options.token}`, 'content-type': 'application/json' },
          body,
          signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
          redirect: 'manual',
        }).then((response) => {
          if (!response.ok) {
            throw new AxError(`AX worker ${action}: HTTP ${response.status}`, response.status)
          }

          return response.text()
        }),
      catch: (cause) =>
        cause instanceof AxError ? cause : new AxError(`AX worker ${action} transport failed`),
    })

  const body = stringifyJson({ instance })

  const program = Effect.gen(function* () {
    const assignmentText = yield* call('begin', body).pipe(
      Effect.retry({
        times: 600,
        while: (error) => error.status === 425 || error.status === 0 || error.status >= 500,
        schedule: Schedule.spaced(500),
      }),
    )

    const assignment = yield* Schema.decodeEffect(Schema.fromJsonString(AxAssignmentSchema))(
      assignmentText,
    )

    const heartbeat = Effect.forever(
      Effect.sleep(heartbeatMs).pipe(Effect.andThen(call('heartbeat', body))),
    )

    const work = Effect.tryPromise({
      try: (signal) => options.handle(assignment, signal),
      catch: (cause) => new AxError(cause instanceof Error ? cause.message : 'AX handler failed'),
    }).pipe(
      Effect.catch((error) => Effect.succeed<AxOutcome>({ kind: 'fail', error: error.message })),
    )

    // A failed heartbeat revokes local execution. It must not be reported as successful work.
    const result = yield* Effect.raceFirst(work, heartbeat)

    yield* call('result', stringifyJson({ instance, outcome: result })).pipe(
      Effect.retry({ times: 3, while: (error) => error.status === 0 || error.status >= 500 }),
    )
  })

  return Effect.runPromise(program, { signal: options.signal })
}
