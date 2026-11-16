/**
 * What a client store reports about how the run felt to use: how long it took to show, and how
 * long each write took to be acknowledged and then confirmed. Durations are in milliseconds.
 */
export type StoreObservation =
  | {
      /** The store holds everything the log had when it connected. Reported once per store. */
      readonly type: 'store.synced'
      readonly runId: string
      readonly at: number
      /** From the store's creation. */
      readonly durationMs: number
      readonly eventCount: number
      /** How many of those events came from the device's cache and were not downloaded. */
      readonly cachedEvents: number
    }
  | {
      readonly type: 'store.connection'
      readonly runId: string
      readonly at: number
      readonly status: 'connecting' | 'live' | 'reconnecting'
    }
  | {
      /** The host answered a commit. */
      readonly type: 'commit.acked'
      readonly runId: string
      readonly at: number
      readonly durationMs: number
      readonly eventCount: number
      readonly optimistic: boolean
    }
  | {
      /** The host's copy of an optimistic commit arrived on the event stream. */
      readonly type: 'commit.confirmed'
      readonly runId: string
      readonly at: number
      /** From the call to `commit`. */
      readonly durationMs: number
    }
  | {
      readonly type: 'commit.failed'
      readonly runId: string
      readonly at: number
      readonly durationMs: number
      readonly message: string
    }

export interface StoreObserver {
  observe(observation: StoreObservation): void
}
