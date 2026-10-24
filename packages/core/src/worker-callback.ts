import type { EventInput } from './envelope'
import type { SecretContext } from './run-context'
import type { JsonValue } from './types'

/** Identifies one attempt of an effect executed by an external worker. */
export interface WorkerCallback {
  readonly effectId: string
  readonly attempt: number
}

/** What an external worker reports about an effect attempt. */
export type WorkerCallbackInput =
  | (WorkerCallback & { readonly kind: 'started' | 'cancelled' })
  | (WorkerCallback & { readonly kind: 'heartbeat'; readonly details?: JsonValue })
  | (WorkerCallback & { readonly kind: 'complete'; readonly events: ReadonlyArray<EventInput> })
  | (WorkerCallback & {
      readonly kind: 'fail'
      readonly error: string
      /** When set, the attempt is terminal even if the retry policy has attempts left. */
      readonly nonRetryable?: boolean
      /** Extra delay before the next attempt. The policy backoff is never shortened. */
      readonly retryAfterMs?: number
    })

export type WorkerCallbackKind = WorkerCallbackInput['kind']

/**
 * What the host tells the worker about the callback it just sent.
 * A queued message cannot be recalled, so `cancelRequested` is how an in-flight attempt learns to stop.
 */
export interface WorkerCallbackResult {
  readonly status: 'accepted' | 'stale' | 'cancelled'
  readonly cancelRequested: boolean
}

/** The run's secret context, released only to the attempt that is currently running. */
export type WorkerSecretsResult =
  | { readonly status: 'accepted'; readonly secrets: SecretContext }
  | { readonly status: 'stale' | 'cancelled' }
