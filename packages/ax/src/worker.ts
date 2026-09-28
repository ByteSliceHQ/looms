import { Effect } from 'effect'

import { stringifyJson } from '@looms/core'
import type { EffectWorker, EffectWorkerTask } from '@looms/runtime'

import { AX_PROTOCOL_VERSION, AxError, axJobId, type AxSubmission } from './protocol'

export interface AxWorkerOptions {
  readonly endpoint: string
  readonly token: string
  /** Must match the bridge's authenticated application scope. */
  readonly scope: string
  readonly callbackTarget: string
  readonly routes: Readonly<Record<string, { readonly profile: string }>>
  readonly timeoutMs?: number
  readonly fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
  /** HTTP is useful on a private local cluster; TLS is required otherwise. */
  readonly allowInsecureHttp?: boolean
}

/** Optional Fetch-only executor; importing this module opens no connections. */
export function createAxWorker(options: AxWorkerOptions): EffectWorker {
  const endpoint = new URL(options.endpoint)

  if (
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    (endpoint.protocol !== 'https:' &&
      !(options.allowInsecureHttp && endpoint.protocol === 'http:'))
  ) {
    throw new AxError('AX bridge requires an HTTPS URL (or explicit local HTTP opt-in)')
  }

  if (!options.scope || !options.token || !options.callbackTarget) {
    throw new AxError('AX scope, token, and callbackTarget are required')
  }

  const timeoutMs = options.timeoutMs ?? 10_000

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30_000) {
    throw new AxError('AX submission timeout must be between 1 and 30000 ms')
  }

  const routes = new Map(
    Object.entries(options.routes).map(([type, route]) => [type, route.profile]),
  )

  const transport = options.fetch ?? globalThis.fetch
  const base = endpoint.href.replace(/\/$/, '')

  const send = (task: EffectWorkerTask, cancellation: boolean): Promise<void> => {
    const profile = routes.get(task.type)

    if (!profile || !Number.isSafeInteger(task.attempt) || task.attempt < 1) {
      return Promise.reject(new AxError('Unregistered AX effect or invalid attempt'))
    }

    const submission: AxSubmission = {
      protocol: AX_PROTOCOL_VERSION,
      scope: options.scope,
      callbackTarget: options.callbackTarget,
      profile,
      task,
    }

    return axJobId(options.scope, task).then((jobId) =>
      Effect.runPromise(
        Effect.tryPromise({
          try: () =>
            transport(`${base}/v1/jobs/${jobId}${cancellation ? '/cancellation' : ''}`, {
              method: 'PUT',
              headers: {
                authorization: `Bearer ${options.token}`,
                'content-type': 'application/json',
              },
              body: stringifyJson(submission),
              signal: AbortSignal.timeout(timeoutMs),
              redirect: 'manual',
            }).then((response) => {
              if (!response.ok) {
                throw new AxError(`AX bridge ${jobId}: HTTP ${response.status}`, response.status)
              }
            }),
          catch: (cause) =>
            cause instanceof AxError ? cause : new AxError('AX bridge request failed'),
        }).pipe(
          Effect.retry({
            times: 2,
            while: (error) => error.status === 0 || error.status === 429 || error.status >= 500,
          }),
        ),
      ),
    )
  }

  return {
    handles: Array.from(routes.keys()),
    dispatch: (task) => send(task, false),
    cancel: (task) => send(task, true),
  }
}
