import { Schema } from 'effect'

import {
  defineProjection,
  type EventEnvelope,
  type JsonValue,
  type RegisteredEvent,
} from '@swirls/looms/core'
import {
  defineLiveFold,
  foldLive,
  useLiveFold,
  useRunEvents,
  type LiveFoldDefinition,
  type LoomsClientStore,
} from '@swirls/looms/react'

import type { Equal, Expect } from '../expect'

export type FallsBackToEnvelope = Expect<Equal<RegisteredEvent, EventEnvelope>>

export const count = defineProjection({
  name: 'count',
  initialState: 0,
  reduce(state, event) {
    type Event = Expect<Equal<typeof event, EventEnvelope>>
    type Payload = Expect<Equal<typeof event.payload, JsonValue>>

    return state + 1
  },
})

type CounterEvent = EventEnvelope<'counter.added', { amount: number }>

export const total = defineProjection({
  name: 'total',
  initialState: 0,
  reduce(state, event: CounterEvent) {
    return state + event.payload.amount
  },
})

const PartsSchema = Schema.Struct({ parts: Schema.Array(Schema.String) })

type Parts = typeof PartsSchema.Type

export const parts = defineLiveFold({
  shape: PartsSchema,
  initialState: { parts: [] },
  reduce(state, event) {
    type State = Expect<Equal<typeof state, Parts>>
    type Event = Expect<Equal<typeof event, EventEnvelope>>

    return state
  },
})

export type ShapeInfersState = Expect<Equal<typeof parts, LiveFoldDefinition<Parts>>>

export const mismatched = defineLiveFold({
  shape: PartsSchema,
  // @ts-expect-error initialState must match the shape
  initialState: { parts: 'not an array' },
  reduce: (state) => state,
})

export const text = defineLiveFold({
  initialState: '',
  reduce: (state, event) => state + event.type,
})

export function foldText(events: readonly EventEnvelope[]): string {
  return foldLive(text, events)
}

export function useHookTypes(store: LoomsClientStore) {
  const events = useRunEvents(store)
  const streamed = useLiveFold(store, parts)

  // @ts-expect-error a projection is not a live fold
  const projected = useLiveFold(store, count)

  type Events = Expect<Equal<typeof events, readonly EventEnvelope[]>>
  type Streamed = Expect<Equal<typeof streamed, Parts>>

  return { events, streamed, projected }
}
