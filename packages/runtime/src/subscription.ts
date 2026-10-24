import { Effect } from 'effect'

import {
  subscriptionReplay,
  type EventEnvelope,
  type EventStore,
  type EventStoreError,
  type SubscriptionHello,
  type SubscriptionOpening,
} from '@looms/core'

export function readSubscriptionBounds(
  store: EventStore,
  runId: string,
): Effect.Effect<{ readonly head: number; readonly tail: number }, EventStoreError> {
  if (store.bounds) {
    return store.bounds(runId)
  }

  return store.tail(runId).pipe(Effect.map((tail) => ({ head: 1, tail })))
}

/** Hello plus the retained events, or a resync when `fromSeq` is below the log head. */
export function loadSubscriptionOpening(
  store: EventStore,
  runId: string,
  fromSeq: number,
): Effect.Effect<SubscriptionOpening, EventStoreError> {
  return Effect.gen(function* () {
    const bounds = yield* readSubscriptionBounds(store, runId)
    const decision = subscriptionReplay(bounds.head, fromSeq)

    if (decision.kind === 'resync') {
      return { kind: 'resync', head: decision.head }
    }

    const events: readonly EventEnvelope[] = yield* store.read(runId, {
      fromSeq: decision.fromSeq,
    })

    const hello: SubscriptionHello = { type: 'hello', head: bounds.head, tail: bounds.tail }

    return { kind: 'open', hello, events }
  })
}
