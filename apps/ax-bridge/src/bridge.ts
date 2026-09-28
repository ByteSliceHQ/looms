import { createHmac, timingSafeEqual } from 'node:crypto'

import { Clock, Effect, Schema } from 'effect'

import { stringifyJson } from '@looms/core'

import {
  AxOutcomeSchema,
  AxSubmissionSchema,
  axJobId,
  canonicalJson,
  digest,
  logicalEffectKey,
} from '../../../packages/ax/src/protocol'
import { loomsClient } from './looms-client'
import {
  BridgeError,
  conflict,
  io,
  type AxControl,
  type BridgeConfig,
  type Job,
  type JobStore,
} from './model'

const BeginSchema = Schema.Struct({ instance: Schema.String })
const ResultSchema = Schema.Struct({ instance: Schema.String, outcome: AxOutcomeSchema })
const active = new Set(['dispatched', 'started', 'heartbeat'])

function equalToken(actual: string, expected: string): boolean {
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const readBody = (request: Request) =>
  io(() => request.text()).pipe(
    Effect.filterOrFail(
      (text) => text.length <= 262_144,
      () => new BridgeError({ message: 'Body too large', status: 413 }),
    ),
  )

export function createBridge(
  config: BridgeConfig,
  store: JobStore,
  ax: AxControl,
  transport: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response> = globalThis.fetch,
) {
  if (config.hostToken.length < 32 || config.capabilitySecret.length < 32) {
    throw new Error('Bridge credentials must have at least 32 characters')
  }

  const profiles = new Map(config.profiles.map((profile) => [profile.id, profile]))

  if (profiles.size !== config.profiles.length) {
    throw new Error('Execution profile IDs must be unique')
  }

  for (const profile of profiles.values()) {
    if (
      !/^.+@sha256:[a-f0-9]{64}$/.test(profile.image) ||
      !profile.id ||
      !profile.gateway ||
      profile.command.length === 0 ||
      profile.maxDurationMs <= 0 ||
      profile.maxDurationMs > 3_600_000 ||
      profile.allowedEvents.some(
        (type) => type.startsWith('runtime.') || type.startsWith('approval.'),
      )
    ) {
      throw new Error(`Invalid immutable execution profile: ${profile.id}`)
    }
  }

  const looms = loomsClient(config.target, transport)

  const capability = (id: string) =>
    createHmac('sha256', config.capabilitySecret).update(id).digest('hex')

  const decodeSubmission = Schema.decodeEffect(Schema.fromJsonString(AxSubmissionSchema))

  const route = (request: Request) =>
    Effect.gen(function* () {
      const path = new URL(request.url).pathname

      if (request.method === 'GET' && path === '/health') {
        return Response.json({ ok: true, protocol: 1 })
      }

      const match =
        /^\/v1\/jobs\/(looms-[a-f0-9]{40})(?:\/(cancellation|begin|heartbeat|result))?$/.exec(path)

      const id = match?.[1]
      const action = match?.[2]

      if (!id) {
        return new Response('Not Found', { status: 404 })
      }

      const workerAction = action === 'begin' || action === 'heartbeat' || action === 'result'
      const expectedToken = workerAction ? capability(id) : config.hostToken

      if (!equalToken(request.headers.get('authorization') ?? '', `Bearer ${expectedToken}`)) {
        return new Response('Unauthorized', { status: 401 })
      }

      if (request.method === 'PUT' && (!action || action === 'cancellation')) {
        const submission = yield* readBody(request).pipe(Effect.flatMap(decodeSubmission))

        if (
          submission.scope !== config.scope ||
          submission.callbackTarget !== config.target.id ||
          !Number.isSafeInteger(submission.task.attempt) ||
          submission.task.attempt < 1 ||
          !submission.task.runId ||
          !submission.task.effectId
        ) {
          return new Response('Invalid application scope or attempt', { status: 400 })
        }

        const expectedId = yield* io(() => axJobId(config.scope, submission.task))
        const profile = profiles.get(submission.profile)

        if (expectedId !== id || !profile || profile.effectType !== submission.task.type) {
          return new Response('Invalid job identity or profile', { status: 400 })
        }

        const requestHash = yield* io(() => digest(canonicalJson({ submission, profile })))
        const logicalKey = yield* io(() => logicalEffectKey(config.scope, submission.task))
        const now = yield* Clock.currentTimeMillis

        const job = yield* io(() =>
          store.accept({
            id,
            logicalKey,
            requestHash,
            submission,
            profile,
            cancelled: action === 'cancellation',
            launched: false,
            stopped: false,
            instance: null,
            outcome: null,
            outcomeDigest: null,
            delivery: 'pending',
            createdAt: now,
            expiresAt: now + profile.maxDurationMs,
            lastError: null,
          }),
        )

        return Response.json({ jobId: job.id, cancelled: job.cancelled }, { status: 202 })
      }

      const job = yield* io(() => store.get(id))

      if (!job || job.submission.scope !== config.scope) {
        return new Response('Not Found', { status: 404 })
      }

      if (request.method === 'GET' && !action) {
        return Response.json(job)
      }

      if (request.method !== 'POST' || !workerAction) {
        return new Response('Method Not Allowed', { status: 405 })
      }

      const text = yield* readBody(request)
      const body = yield* Schema.decodeEffect(Schema.fromJsonString(BeginSchema))(text)

      if (body.instance.length < 16 || body.instance.length > 100) {
        return new Response('Invalid worker instance', { status: 400 })
      }

      if (action === 'result') {
        const { outcome } = yield* Schema.decodeEffect(Schema.fromJsonString(ResultSchema))(text)

        if (
          outcome.kind === 'complete' &&
          (outcome.events.length > 100 ||
            outcome.events.some(
              (event) =>
                !job.profile.allowedEvents.includes(event.type) ||
                event.type.startsWith('runtime.') ||
                event.type.startsWith('approval.'),
            ))
        ) {
          return new Response('Unauthorized outcome event', { status: 400 })
        }

        const receivedAt = yield* Clock.currentTimeMillis
        const outcomeDigest = yield* io(() => digest(canonicalJson(outcome)))

        yield* io(() =>
          store.update(id, (current) => {
            if (current.instance !== body.instance) {
              conflict('Worker instance is not authorized')
            }

            if (current.outcomeDigest) {
              if (current.outcomeDigest !== outcomeDigest) {
                conflict('Conflicting terminal outcome')
              }

              return current
            }

            if (current.cancelled || current.stopped || receivedAt >= current.expiresAt) {
              conflict('Attempt revoked')
            }

            // The terminal receipt is itself the durable delivery outbox.
            return { ...current, outcome, outcomeDigest }
          }),
        )

        return Response.json({ accepted: true })
      }

      const now = yield* Clock.currentTimeMillis

      if (job.cancelled || job.stopped || job.outcome || now >= job.expiresAt) {
        return new Response('Attempt revoked or already finished', { status: 409 })
      }

      const state = yield* looms.state(job)
      const execution = state.effectExecutions[job.submission.task.effectId]

      if (execution?.attempt === job.submission.task.attempt && execution.status === 'queued') {
        return new Response('Dispatch has not committed', { status: 425 })
      }

      if (
        state.status !== 'running' ||
        execution?.attempt !== job.submission.task.attempt ||
        !active.has(execution.status)
      ) {
        return new Response('Attempt is not active', { status: 409 })
      }

      if (action === 'begin') {
        // Template preparation also boots the image. Only the real Task's running actor may begin.
        if (!(yield* io(() => ax.ready(job)))) {
          return new Response('AX actor and gateway are not ready', { status: 425 })
        }

        const siblings = yield* io(() => store.siblings(job.logicalKey))

        if (siblings.some((sibling) => sibling.id !== id && !sibling.stopped)) {
          return new Response('Prior attempt has not stopped', { status: 425 })
        }

        yield* io(() =>
          store.update(id, (current) => {
            if (
              current.cancelled ||
              current.stopped ||
              current.outcome ||
              current.instance !== null
            ) {
              // Golden snapshots can preserve a process UUID. Never issue a second admission,
              // even for that UUID; an uncertain start must use Looms timeout/retry recovery.
              conflict('Attempt already claimed or revoked')
            }

            return { ...current, instance: body.instance }
          }),
        )

        const started = yield* looms.callback(job, 'started')
        const confirmed = started.effectExecutions[job.submission.task.effectId]

        if (
          confirmed?.attempt !== job.submission.task.attempt ||
          !['started', 'heartbeat'].includes(confirmed.status)
        ) {
          return new Response('Start was not admitted', { status: 409 })
        }

        return Response.json({ task: job.submission.task, idempotencyKey: job.logicalKey })
      }

      if (job.instance !== body.instance) {
        return new Response('Worker instance is not authorized', { status: 409 })
      }

      const heartbeat = yield* looms.callback(job, 'heartbeat')
      const confirmed = heartbeat.effectExecutions[job.submission.task.effectId]

      return confirmed?.attempt === job.submission.task.attempt && confirmed.status === 'heartbeat'
        ? Response.json({ accepted: true })
        : new Response('Heartbeat was not admitted', { status: 409 })
    })

  const stop = (job: Job) =>
    Effect.gen(function* () {
      const stopped = !job.launched || (yield* io(() => ax.stop(job)))

      if (stopped) {
        yield* io(() => store.update(job.id, (current) => ({ ...current, stopped: true })))
      }

      return stopped
    })

  const reconcileJob = (job: Job) =>
    Effect.gen(function* () {
      // Cleanup must continue even while the callback host is unavailable.
      const now = yield* Clock.currentTimeMillis

      if (job.cancelled || job.outcome || now >= job.expiresAt) {
        yield* stop(job)
      }

      const state = yield* looms.state(job)
      const execution = state.effectExecutions[job.submission.task.effectId]
      const sameAttempt = execution?.attempt === job.submission.task.attempt
      const eligible = state.status === 'running' && sameAttempt && active.has(execution.status)

      if (job.outcome && (job.delivery === 'pending' || job.delivery === 'uncertain')) {
        const kind = job.outcome.kind
        const receiptKind = kind === 'complete' ? 'completed' : 'retry.scheduled'
        let applied = yield* looms.receipt(job, receiptKind)

        if (!applied && eligible && !job.cancelled) {
          yield* looms.callback(job, kind, stringifyJson(job.outcome))
          applied = yield* looms.receipt(job, receiptKind)
        }

        const stopped = yield* stop(job)

        if (sameAttempt && execution.status === 'cancel_requested') {
          if (!stopped) {
            return
          }

          // Keep delivery pending until cancellation is acknowledged, including after response loss.
          yield* looms.callback(job, 'cancelled')
        }

        yield* io(() =>
          store.update(job.id, (current) => ({
            ...current,
            delivery: applied ? 'applied' : eligible ? 'uncertain' : 'obsolete',
          })),
        )

        return
      }

      if (
        job.outcome ||
        job.cancelled ||
        now >= job.expiresAt ||
        (!eligible && execution?.status !== 'queued')
      ) {
        yield* io(() => store.update(job.id, (current) => ({ ...current, cancelled: true })))

        if (yield* stop(job)) {
          if (sameAttempt && execution.status === 'cancel_requested') {
            yield* looms.callback(job, 'cancelled')
          }

          yield* io(() =>
            store.update(job.id, (current) => ({
              ...current,
              delivery: current.delivery === 'pending' ? 'obsolete' : current.delivery,
            })),
          )
        }

        return
      }

      if (!eligible || job.instance) {
        return
      }

      const siblings = yield* io(() => store.siblings(job.logicalKey))

      for (const sibling of siblings) {
        if (sibling.id === job.id || sibling.stopped) {
          continue
        }

        if (sibling.submission.task.attempt >= job.submission.task.attempt) {
          return
        }

        yield* io(() => store.update(sibling.id, (current) => ({ ...current, cancelled: true })))

        if (!(yield* stop(sibling))) {
          return
        }
      }

      // Persist launch intent before RPC so a lost response is reconciled by deterministic identity.
      const intent = yield* io(() =>
        store.update(job.id, (current) => ({ ...current, launched: true })),
      )

      if (!intent.cancelled && !intent.stopped) {
        yield* io(() => ax.ensure(intent, capability(intent.id)))
      }
    })

  const reconcile = io(() => store.pending()).pipe(
    Effect.flatMap((jobs) =>
      Effect.forEach(
        jobs,
        (job) =>
          reconcileJob(job).pipe(
            Effect.tap(() =>
              job.lastError
                ? io(() => store.update(job.id, (current) => ({ ...current, lastError: null })))
                : Effect.void,
            ),
            Effect.catch((error) =>
              io(() =>
                store.update(job.id, (current) => ({
                  ...current,
                  lastError: error.message.slice(0, 500),
                })),
              ).pipe(Effect.asVoid),
            ),
          ),
        { discard: true },
      ),
    ),
  )

  return {
    reconcile,
    fetch: (request: Request) =>
      Effect.runPromise(
        route(request).pipe(
          Effect.catch((error) =>
            Effect.succeed(
              Response.json(
                {
                  error:
                    error instanceof BridgeError
                      ? error.message
                      : 'Invalid request or upstream response',
                },
                {
                  status: error instanceof BridgeError ? error.status : 400,
                },
              ),
            ),
          ),
        ),
      ),
  }
}
