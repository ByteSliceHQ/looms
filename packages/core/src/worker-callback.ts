import type { EventInput } from './envelope'

/** Identifies one attempt of an effect executed by an external worker. */
export interface WorkerCallback {
  readonly effectId: string
  readonly attempt: number
}

/** What an external worker reports about an effect attempt. */
export type WorkerCallbackInput =
  | (WorkerCallback & { readonly kind: 'started' | 'heartbeat' | 'cancelled' })
  | (WorkerCallback & { readonly kind: 'complete'; readonly events: ReadonlyArray<EventInput> })
  | (WorkerCallback & { readonly kind: 'fail'; readonly error: string })

export type WorkerCallbackKind = WorkerCallbackInput['kind']
