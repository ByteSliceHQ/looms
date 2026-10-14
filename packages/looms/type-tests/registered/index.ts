import { Schema } from 'effect'

import { agent, type AgentTurnTextDeltaPayloadSchema } from '@swirls/looms/agent'
import {
  defineEventCatalog,
  defineProjection,
  type EventsOf,
  type RegisteredEvent,
} from '@swirls/looms/core'
import {
  defineLiveFold,
  foldLive,
  useLiveFold,
  useRunEvents,
  type LoomsClientStore,
} from '@swirls/looms/react'

import type { Equal, Expect, IsAny } from '../expect'

const billing = defineEventCatalog('billing', {
  charged: Schema.Struct({ cents: Schema.Finite }),
})

const modules = [agent()] as const

type AppEvents = EventsOf<typeof modules> | EventsOf<typeof billing>

declare module '@swirls/looms/react' {
  interface LoomsRegister {
    events: AppEvents
  }
}

type TextDelta = Extract<RegisteredEvent, { type: 'agent.turn.text_delta' }>

type Charged = Extract<RegisteredEvent, { type: 'billing.charged' }>

export type RegistersAppEvents = Expect<Equal<RegisteredEvent, AppEvents>>

export type PayloadsAreNotAny = Expect<Equal<IsAny<RegisteredEvent['payload']>, false>>

export type ModulePayloadsAreTyped = Expect<
  Equal<TextDelta['payload'], typeof AgentTurnTextDeltaPayloadSchema.Type>
>

export type CatalogPayloadsAreTyped = Expect<Equal<Charged['payload'], { readonly cents: number }>>

export const revenue = defineProjection({
  name: 'revenue',
  initialState: 0,
  reduce(state, event) {
    type Event = Expect<Equal<typeof event, RegisteredEvent>>

    // @ts-expect-error unregistered event types are rejected
    if (event.type === 'billing.refunded') {
      return state
    }

    if (event.type === 'billing.charged') {
      return state + event.payload.cents
    }

    return state
  },
})

export const streamed = defineLiveFold({
  initialState: '',
  reduce(state, event) {
    type Event = Expect<Equal<typeof event, RegisteredEvent>>

    return event.type === 'agent.turn.text_delta' ? state + event.payload.delta : state
  },
})

export function foldStreamed(events: readonly RegisteredEvent[]): string {
  return foldLive(streamed, events)
}

export function useHookTypes(store: LoomsClientStore) {
  const events = useRunEvents(store)
  const text = useLiveFold(store, streamed)

  type Events = Expect<Equal<typeof events, readonly RegisteredEvent[]>>
  type Text = Expect<Equal<typeof text, string>>

  return { events, text }
}
